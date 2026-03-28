import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { Parser } from 'json2csv';
import { CreatureService } from '../creatures/creature.service';
import { RpgSystemService } from '../rpg-systems/rpg-system.service';
import {
  withCache,
  deleteCacheValue,
  deleteCacheByPattern,
  CacheKeys,
  CacheTTL,
} from '../../config/redis';

const rpgSystemService = new RpgSystemService();
const creatureService = new CreatureService();

export class CampaignService {
  async createCampaign(ownerId: string, name: string, description: string | undefined, system: string) {
    const campaign = await prisma.$transaction(async (tx) => {
      const systemTemplate = await rpgSystemService.resolveSystemFromInput(system, tx);
      const createdCampaign = await tx.campaign.create({
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
          entityId: createdCampaign.id,
        },
      });

      await tx.node.upsert({
        where: {
          campaignId_entityType_sourceId: {
            campaignId: createdCampaign.id,
            entityType: 'LEGACY_ANCHOR',
            sourceId: createdCampaign.id,
          },
        },
        update: {
          type: 'CAMPAIGN',
          title: createdCampaign.name,
          content: {
            campaignId: createdCampaign.id,
            name: createdCampaign.name,
            description: createdCampaign.description,
            system: createdCampaign.system,
          },
          label: createdCampaign.name,
          metadata: {
            description: createdCampaign.description,
            system: createdCampaign.system,
          },
        },
        create: {
          campaignId: createdCampaign.id,
          type: 'CAMPAIGN',
          title: createdCampaign.name,
          content: {
            campaignId: createdCampaign.id,
            name: createdCampaign.name,
            description: createdCampaign.description,
            system: createdCampaign.system,
          },
          entityType: 'LEGACY_ANCHOR',
          sourceId: createdCampaign.id,
          label: createdCampaign.name,
          metadata: {
            description: createdCampaign.description,
            system: createdCampaign.system,
          },
        },
      });

      return createdCampaign;
    });

    // Keep list/dashboard in sync right after creation.
    await Promise.all([
      deleteCacheValue(CacheKeys.userCampaigns(ownerId)),
      deleteCacheValue(`dashboard:${ownerId}`),
      deleteCacheByPattern(`node:${campaign.id}:*`),
      deleteCacheByPattern(`core:${campaign.id}:*`),
    ]);

    return campaign;
  }

  async getUserCampaigns(userId: string) {
    return withCache(
      CacheKeys.userCampaigns(userId),
      CacheTTL.USER_CAMPAIGNS,
      async () => {
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
    );
  }

  async getCampaignById(campaignId: string) {
    return withCache(
      CacheKeys.campaign(campaignId),
      CacheTTL.CAMPAIGN,
      async () => {
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
    );
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

    await prisma.node.updateMany({
      where: {
        campaignId,
        entityType: 'LEGACY_ANCHOR',
        sourceId: campaignId,
      },
      data: {
        type: 'CAMPAIGN',
        title: campaign.name,
        content: {
          campaignId: campaign.id,
          name: campaign.name,
          description: campaign.description,
          system: campaign.system,
        },
        label: campaign.name,
        metadata: {
          description: campaign.description,
          system: campaign.system,
        },
      },
    });

    // Invalidate caches
    await Promise.all([
      deleteCacheValue(CacheKeys.campaign(campaignId)),
      deleteCacheValue(CacheKeys.campaignStats(campaignId)),
      deleteCacheByPattern('user:*:campaigns'),
      deleteCacheByPattern(`node:${campaignId}:*`),
      deleteCacheByPattern(`core:${campaignId}:*`),
    ]);

    return campaign;
  }

  async deleteCampaign(campaignId: string) {
    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    // Invalidate caches
    await Promise.all([
      deleteCacheValue(CacheKeys.campaign(campaignId)),
      deleteCacheValue(CacheKeys.campaignStats(campaignId)),
      deleteCacheByPattern('user:*:campaigns'),
      deleteCacheByPattern(`campaign:${campaignId}:*`),
      deleteCacheByPattern(`node:${campaignId}:*`),
      deleteCacheByPattern(`core:${campaignId}:*`),
    ]);
  }

  async addMember(campaignId: string, userId: string, role: 'GM' | 'PLAYER') {
    const member = await prisma.$transaction(async (tx) => {
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

      const newMember = await tx.campaignMember.create({
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

      return newMember;
    });

    // Invalidate caches
    await Promise.all([
      deleteCacheValue(CacheKeys.campaign(campaignId)),
      deleteCacheValue(CacheKeys.userCampaigns(userId)),
    ]);

    return member;
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

    // Invalidate caches
    await Promise.all([
      deleteCacheValue(CacheKeys.campaign(campaignId)),
      deleteCacheValue(CacheKeys.userCampaigns(userId)),
    ]);
  }

  async getCampaignStats(campaignId: string) {
    return withCache(
      CacheKeys.campaignStats(campaignId),
      CacheTTL.CAMPAIGN_STATS,
      async () => {
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
    );
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

  async generateEncounter(
    campaignId: string,
    requestedBy: string,
    context: {
      partyLevel: number;
      partySize: number;
      environment: string;
      difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
    }
  ) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        systemTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
            attributeSchema: true,
          },
        },
      },
    });

    if (!campaign || !campaign.systemId || !campaign.systemTemplate) {
      throw new AppError(404, 'Campaign or system not found');
    }

    await creatureService.ensureDefaultCreatures(requestedBy);

    const creatures = await prisma.creature.findMany({
      where: {
        systemId: campaign.systemId,
        OR: [{ isPublic: true }, { createdBy: requestedBy }],
      },
      orderBy: [{ xpReward: 'asc' }, { name: 'asc' }],
    });

    if (creatures.length === 0) {
      throw new AppError(404, 'No creatures available for this system');
    }

    const difficultyFactors: Record<'easy' | 'medium' | 'hard' | 'deadly', number> = {
      easy: 1,
      medium: 1.5,
      hard: 2.1,
      deadly: 3,
    };

    const systemFactor =
      campaign.systemTemplate.slug === 'coc7e'
        ? 35
        : campaign.systemTemplate.slug === 'pf2e'
          ? 45
          : campaign.systemTemplate.slug === 'tormenta20'
            ? 50
            : 55;

    const budget =
      Math.max(1, Math.round(context.partyLevel * context.partySize * difficultyFactors[context.difficulty] * systemFactor));

    let spent = 0;
    const selected: Array<{
      id: string;
      name: string;
      creatureType: string;
      xpReward: number;
      count: number;
      suggestedInitiative: number;
    }> = [];

    for (const creature of [...creatures].sort((a, b) => (b.xpReward ?? 0) - (a.xpReward ?? 0))) {
      const xpReward = creature.xpReward ?? systemFactor;
      if (xpReward > budget && selected.length > 0) {
        continue;
      }

      const count = Math.max(1, Math.min(3, Math.floor((budget - spent) / xpReward) || 1));
      spent += xpReward * count;

      selected.push({
        id: creature.id,
        name: creature.name,
        creatureType: creature.creatureType,
        xpReward,
        count,
        suggestedInitiative: this.estimateInitiativeFromStats(creature.stats),
      });

      if (spent >= budget || selected.length >= 4) {
        break;
      }
    }

    const fallbackCreature = creatures[0];
    if (selected.length === 0 && fallbackCreature) {
      selected.push({
        id: fallbackCreature.id,
        name: fallbackCreature.name,
        creatureType: fallbackCreature.creatureType,
        xpReward: fallbackCreature.xpReward ?? systemFactor,
        count: 1,
        suggestedInitiative: this.estimateInitiativeFromStats(fallbackCreature.stats),
      });
    }

    return {
      campaignId,
      system: {
        id: campaign.systemTemplate.id,
        name: campaign.systemTemplate.name,
        slug: campaign.systemTemplate.slug,
      },
      budget,
      difficulty: context.difficulty,
      environment: context.environment,
      creatures: selected,
      narrative: this.buildEncounterNarrative(
        campaign.systemTemplate.name,
        context.environment,
        context.difficulty,
        selected
      ),
      rulesContext: campaign.systemTemplate.attributeSchema,
    };
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

  private estimateInitiativeFromStats(stats: unknown): number {
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      return 10;
    }

    const values = stats as Record<string, unknown>;
    const attributes =
      values.attributes && typeof values.attributes === 'object' && !Array.isArray(values.attributes)
        ? (values.attributes as Record<string, unknown>)
        : {};

    const dexLike =
      attributes.DEX ??
      attributes.DES ??
      values.dexterity ??
      values.initiative ??
      10;

    const initiative = typeof dexLike === 'number' ? dexLike : Number(dexLike);
    return Number.isFinite(initiative) ? Math.max(1, Math.min(30, Math.round(initiative))) : 10;
  }

  private buildEncounterNarrative(
    systemName: string,
    environment: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'deadly',
    creatures: Array<{ name: string; count: number }>
  ): string {
    const creatureSummary = creatures
      .map((creature) => `${creature.count}x ${creature.name}`)
      .join(', ');

    return `Encounter for ${systemName} in ${environment}: a ${difficulty} scene featuring ${creatureSummary}. Build the scene with layered terrain, an immediate tactical pressure point, and one narrative hook that ties the fight back to the campaign.`;
  }
}
