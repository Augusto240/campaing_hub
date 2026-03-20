import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { Parser } from 'json2csv';
import { RpgSystemService } from '../rpg-systems/rpg-system.service';

const rpgSystemService = new RpgSystemService();

export class CampaignService {
  async createCampaign(ownerId: string, name: string, description: string | undefined, system: string) {
    return prisma.$transaction(async (tx) => {
      const systemTemplate = await rpgSystemService.resolveSystemFromInput(system, tx);
      const campaign = await tx.campaign.create({
        data: {
          name,
          description,
          system: systemTemplate?.slug ?? system,
          systemId: systemTemplate?.id ?? null,
          ownerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          systemTemplate: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: ownerId,
          action: 'CREATE',
          entityType: 'CAMPAIGN',
          entityId: campaign.id,
        },
      });

      return campaign;
    });
  }

  async getUserCampaigns(userId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        systemTemplate: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            characters: true,
            sessions: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns;
  }

  async getCampaignById(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        systemTemplate: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        characters: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        sessions: {
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
        events: {
          orderBy: {
            eventDate: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(
    campaignId: string,
    data: { name?: string; description?: string; system?: string }
  ) {
    let systemId: string | null | undefined;
    let normalizedSystem: string | undefined;

    if (data.system) {
      const systemTemplate = await rpgSystemService.resolveSystemFromInput(data.system);
      systemId = systemTemplate?.id ?? null;
      normalizedSystem = systemTemplate?.slug ?? data.system;
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        description: data.description,
        ...(normalizedSystem !== undefined ? { system: normalizedSystem } : {}),
        ...(systemId !== undefined ? { systemId } : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        systemTemplate: true,
      },
    });

    return campaign;
  }

  async deleteCampaign(campaignId: string) {
    await prisma.campaign.delete({
      where: { id: campaignId },
    });
  }

  async addMember(campaignId: string, userId: string, role: 'GM' | 'PLAYER') {
    return prisma.$transaction(async (tx) => {
      const existingMember = await tx.campaignMember.findUnique({
        where: {
          campaignId_userId: {
            campaignId,
            userId,
          },
        },
      });

      if (existingMember) {
        throw new AppError(409, 'User is already a member of this campaign');
      }

      const member = await tx.campaignMember.create({
        data: {
          campaignId,
          userId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId,
          message: 'You have been added to a campaign',
        },
      });

      return member;
    });
  }

  async removeMember(campaignId: string, userId: string) {
    await prisma.campaignMember.delete({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
    });
  }

  async getCampaignStats(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sessions: {
          select: {
            xpAwarded: true,
            date: true,
          },
        },
        characters: {
          select: {
            level: true,
            xp: true,
          },
        },
        members: true,
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const totalSessions = campaign.sessions.length;
    const totalXPAwarded = campaign.sessions.reduce((sum, session) => sum + session.xpAwarded, 0);
    const avgXPPerSession = totalSessions > 0 ? totalXPAwarded / totalSessions : 0;
    const avgCharacterLevel =
      campaign.characters.length > 0
        ? campaign.characters.reduce((sum, char) => sum + char.level, 0) /
          campaign.characters.length
        : 0;

    // Sessions per month (last 12 months)
    const sessionsPerMonth = this.getSessionsPerMonth(campaign.sessions);

    // XP distribution over time
    const xpOverTime = campaign.sessions
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((session) => ({
        date: session.date,
        xp: session.xpAwarded,
      }));

    return {
      totalSessions,
      totalXPAwarded,
      avgXPPerSession,
      totalCharacters: campaign.characters.length,
      avgCharacterLevel,
      totalMembers: campaign.members.length + 1, // +1 for owner
      sessionsPerMonth,
      xpOverTime,
    };
  }

  async exportCampaignData(campaignId: string) {
    const sessions = await prisma.session.findMany({
      where: { campaignId },
      include: {
        loot: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const data = sessions.map((session) => ({
      Date: session.date.toISOString().split('T')[0],
      Summary: session.summary || '',
      XPAwarded: session.xpAwarded,
      LootCount: session.loot.length,
      TotalLootValue: session.loot.reduce((sum, item) => sum + item.value, 0),
    }));

    const parser = new Parser({
      fields: ['Date', 'Summary', 'XPAwarded', 'LootCount', 'TotalLootValue'],
    });

    return parser.parse(data);
  }

  private getSessionsPerMonth(sessions: { date: Date }[]) {
    const monthCounts: { [key: string]: number } = {};

    sessions.forEach((session) => {
      const monthKey = `${session.date.getFullYear()}-${String(
        session.date.getMonth() + 1
      ).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
