import { prisma } from '../../config/database';
import { emitCampaignEvent } from '../../config/realtime';
import { AppError } from '../../utils/error-handler';
import { CharacterService } from '../characters/character.service';
import PDFDocument from 'pdfkit';

const characterService = new CharacterService();

type SessionLogUpdateInput = {
  narrativeLog?: string;
  privateGmNotes?: string;
  highlights?: string[];
};

export class SessionService {
  async createSession(
    createdBy: string,
    campaignId: string,
    date: Date,
    summary: string | undefined,
    xpAwarded: number
  ) {
    const createdSession = await prisma.$transaction(
      async (tx) => {
        const session = await tx.session.create({
          data: {
            campaignId,
            date,
            summary,
            xpAwarded,
            createdBy,
          },
          include: {
            campaign: {
              include: {
                characters: true,
                members: true,
              },
            },
          },
        });

        if (xpAwarded > 0 && session.campaign.characters.length > 0) {
          const xpPerCharacter = Math.floor(xpAwarded / session.campaign.characters.length);

          for (const character of session.campaign.characters) {
            await characterService.addXP(character.id, xpPerCharacter, tx);
          }
        }

        const recipients = new Set<string>(session.campaign.members.map((member) => member.userId));
        recipients.add(session.campaign.ownerId);
        recipients.delete(createdBy);

        const notificationData = Array.from(recipients).map((userId) => ({
          userId,
          message: `New session created in campaign "${session.campaign.name}"`,
        }));

        if (notificationData.length > 0) {
          await tx.notification.createMany({
            data: notificationData,
          });
        }

        await tx.activityLog.create({
          data: {
            userId: createdBy,
            action: 'CREATE',
            entityType: 'SESSION',
            entityId: session.id,
          },
        });

        return session;
      },
      { isolationLevel: 'Serializable' }
    );

    emitCampaignEvent(createdSession.campaignId, 'session:created', {
      session: {
        id: createdSession.id,
        campaignId: createdSession.campaignId,
        date: createdSession.date,
        summary: createdSession.summary,
        xpAwarded: createdSession.xpAwarded,
      },
    });

    return createdSession;
  }

  async getSessionsByCampaign(campaignId: string, viewerId: string) {
    const sessions = await prisma.session.findMany({
      where: { campaignId },
      include: {
        campaign: {
          select: {
            ownerId: true,
            members: {
              where: { userId: viewerId },
              select: { role: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        loot: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return sessions.map((session) => {
      const isGm =
        session.campaign.ownerId === viewerId ||
        session.campaign.members.some((member) => member.role === 'GM');

      const { campaign, privateGmNotes, ...rest } = session;
      if (isGm) {
        return {
          ...rest,
          privateGmNotes,
        };
      }

      return rest;
    });
  }

  async getSessionById(sessionId: string, viewerId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            system: true,
            ownerId: true,
            members: {
              where: {
                userId: viewerId,
              },
              select: {
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        loot: {
          include: {
            assignedToCharacter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const isGm =
      session.campaign.ownerId === viewerId ||
      session.campaign.members.some((member) => member.role === 'GM');

    if (isGm) {
      return session;
    }

    const { privateGmNotes, ...sanitizedSession } = session;
    return sanitizedSession;
  }

  async updateSession(
    sessionId: string,
    data: { date?: Date; summary?: string; xpAwarded?: number }
  ) {
    return prisma.session.update({
      where: { id: sessionId },
      data,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateSessionLog(sessionId: string, data: SessionLogUpdateInput) {
    const updatedLog = await prisma.session.update({
      where: { id: sessionId },
      data: {
        narrativeLog: data.narrativeLog,
        privateGmNotes: data.privateGmNotes,
        highlights: data.highlights,
      },
      select: {
        id: true,
        narrativeLog: true,
        privateGmNotes: true,
        highlights: true,
        updatedAt: true,
      },
    });

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { campaignId: true },
    });

    if (session) {
      emitCampaignEvent(session.campaignId, 'session:log_updated', {
        sessionId: updatedLog.id,
        narrativeLog: updatedLog.narrativeLog,
        highlights: updatedLog.highlights,
        updatedAt: updatedLog.updatedAt,
      });
    }

    return updatedLog;
  }

  async deleteSession(sessionId: string) {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async generateReport(sessionId: string, viewerId: string): Promise<Buffer> {
    const session = await this.getSessionById(sessionId, viewerId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      doc.fontSize(24).text('Session Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).text(`Campaign: ${session.campaign.name}`);
      doc.fontSize(12).text(`System: ${session.campaign.system}`);
      doc.moveDown();

      doc.fontSize(14).text('Session Details', { underline: true });
      doc.fontSize(12).text(`Date: ${session.date.toLocaleDateString()}`);
      doc.text(`Created by: ${session.creator.name}`);
      doc.text(`XP Awarded: ${session.xpAwarded}`);
      doc.moveDown();

      if (session.summary) {
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12).text(session.summary);
        doc.moveDown();
      }

      if (session.loot.length > 0) {
        doc.fontSize(14).text('Loot', { underline: true });
        session.loot.forEach((item) => {
          doc.fontSize(12).text(`- ${item.name} - ${item.value} gold`);
          if (item.description) {
            doc.fontSize(10).text(`  ${item.description}`, { indent: 20 });
          }
          if (item.assignedToCharacter) {
            doc.fontSize(10).text(`  Assigned to: ${item.assignedToCharacter.name}`, {
              indent: 20,
            });
          }
        });
      }

      doc.end();
    });
  }
}
