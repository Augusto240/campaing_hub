import { prisma } from '../../config/database';
import { emitCampaignEvent } from '../../config/realtime';
import { deleteCacheByPattern } from '../../config/redis';
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

        await tx.node.upsert({
          where: {
            campaignId_entityType_sourceId: {
              campaignId,
              entityType: 'SESSION',
              sourceId: session.id,
            },
          },
          update: {
            type: 'SESSION',
            title: session.summary?.trim() || `Session ${session.date.toISOString()}`,
            content: {
              sessionId: session.id,
              date: session.date.toISOString(),
              summary: session.summary,
              xpAwarded: session.xpAwarded,
            },
            label: session.summary?.trim() || `Session ${session.date.toISOString()}`,
            metadata: {
              date: session.date.toISOString(),
              xpAwarded: session.xpAwarded,
            },
          },
          create: {
            campaignId,
            type: 'SESSION',
            title: session.summary?.trim() || `Session ${session.date.toISOString()}`,
            content: {
              sessionId: session.id,
              date: session.date.toISOString(),
              summary: session.summary,
              xpAwarded: session.xpAwarded,
            },
            entityType: 'SESSION',
            sourceId: session.id,
            label: session.summary?.trim() || `Session ${session.date.toISOString()}`,
            metadata: {
              date: session.date.toISOString(),
              xpAwarded: session.xpAwarded,
            },
          },
        });

        return session;
      },
      { isolationLevel: 'Serializable' }
    );

    await Promise.all([
      deleteCacheByPattern(`node:${createdSession.campaignId}:*`),
      deleteCacheByPattern(`core:${createdSession.campaignId}:*`),
    ]);

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
    const updated = await prisma.$transaction(async (tx) => {
      const session = await tx.session.update({
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

      await tx.node.updateMany({
        where: {
          campaignId: session.campaignId,
          entityType: 'SESSION',
          sourceId: session.id,
        },
        data: {
          type: 'SESSION',
          title: session.summary?.trim() || `Session ${session.date.toISOString()}`,
          content: {
            sessionId: session.id,
            date: session.date.toISOString(),
            summary: session.summary,
            xpAwarded: session.xpAwarded,
          },
          label: session.summary?.trim() || `Session ${session.date.toISOString()}`,
          metadata: {
            date: session.date.toISOString(),
            xpAwarded: session.xpAwarded,
          },
        },
      });

      return session;
    });

    await Promise.all([
      deleteCacheByPattern(`node:${updated.campaignId}:*`),
      deleteCacheByPattern(`core:${updated.campaignId}:*`),
    ]);

    return updated;
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
    const deleted = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          campaignId: true,
        },
      });

      if (!session) {
        throw new AppError(404, 'Session not found');
      }

      const sessionNode = await tx.node.findFirst({
        where: {
          campaignId: session.campaignId,
          entityType: 'SESSION',
          sourceId: session.id,
        },
        select: {
          id: true,
        },
      });

      if (sessionNode) {
        await Promise.all([
          tx.nodeRelation.deleteMany({
            where: {
              OR: [{ fromId: sessionNode.id }, { toId: sessionNode.id }],
            },
          }),
          tx.coreRelation.deleteMany({
            where: {
              OR: [{ sourceNodeId: sessionNode.id }, { targetNodeId: sessionNode.id }],
            },
          }),
        ]);

        await tx.node.delete({
          where: {
            id: sessionNode.id,
          },
        });
      }

      await tx.session.delete({
        where: { id: sessionId },
      });

      return session;
    });

    await Promise.all([
      deleteCacheByPattern(`node:${deleted.campaignId}:*`),
      deleteCacheByPattern(`core:${deleted.campaignId}:*`),
    ]);
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
