import { CompendiumKind, filterCompendiumEntries, getCompendiumKindTotals } from './compendium.data';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

type ListCampaignCompendiumInput = {
  campaignId: string;
  userId: string;
  kind?: CompendiumKind;
  search?: string;
  limit: number;
};

type ListSystemCompendiumInput = {
  systemSlug: string;
  kind?: CompendiumKind;
  search?: string;
  limit: number;
};

type CharacterInventory = Array<{
  name?: string;
}>;

const parseCharacterInventory = (value: unknown): CharacterInventory => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => !!entry && typeof entry === 'object')
    .map((entry) => entry as { name?: string });
};

const normalize = (value: string): string => value.trim().toLowerCase();

export class CompendiumService {
  private async resolveCampaignContext(campaignId: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        system: true,
        ownerId: true,
        systemTemplate: {
          select: {
            slug: true,
          },
        },
        members: {
          where: { userId },
          select: {
            id: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const isMember = campaign.ownerId === userId || campaign.members.length > 0;
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    return {
      campaignId: campaign.id,
      systemSlug: campaign.systemTemplate?.slug ?? campaign.system,
    };
  }

  private async mapCampaignLinks(campaignId: string, entries: ReturnType<typeof filterCompendiumEntries>) {
    if (entries.length === 0) {
      return [];
    }

    const names = entries.map((entry) => entry.name);
    const [combatants, characters] = await Promise.all([
      prisma.combatant.findMany({
        where: {
          encounter: {
            session: {
              campaignId,
            },
          },
          name: {
            in: names,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          encounter: {
            select: {
              sessionId: true,
            },
          },
        },
      }),
      prisma.character.findMany({
        where: {
          campaignId,
        },
        select: {
          id: true,
          name: true,
          inventory: true,
        },
      }),
    ]);

    const combatantsByName = new Map<string, Array<{ combatantId: string; sessionId: string }>>();
    for (const combatant of combatants) {
      const key = normalize(combatant.name);
      const current = combatantsByName.get(key) ?? [];
      current.push({
        combatantId: combatant.id,
        sessionId: combatant.encounter.sessionId,
      });
      combatantsByName.set(key, current);
    }

    return entries.map((entry) => {
      const normalizedName = normalize(entry.name);
      const combatLinks = combatantsByName.get(normalizedName) ?? [];

      const characterLinks = characters
        .filter((character) => {
          const inventory = parseCharacterInventory(character.inventory);
          return inventory.some((item) => normalize(String(item.name || '')) === normalizedName);
        })
        .map((character) => ({
          characterId: character.id,
          characterName: character.name,
        }));

      return {
        ...entry,
        links: {
          usedInSessions: Array.from(new Set(combatLinks.map((entryLink) => entryLink.sessionId))),
          usedAsCombatantCount: combatLinks.length,
          linkedCharacters: characterLinks,
        },
      };
    });
  }

  async listCampaignCompendium(input: ListCampaignCompendiumInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);

    const entries = filterCompendiumEntries({
      systemSlug: context.systemSlug,
      kind: input.kind,
      search: input.search,
      limit: input.limit,
    });

    const entriesWithLinks = await this.mapCampaignLinks(context.campaignId, entries);

    return {
      campaignId: context.campaignId,
      systemSlug: context.systemSlug,
      totals: getCompendiumKindTotals(context.systemSlug),
      entries: entriesWithLinks,
    };
  }

  async listCampaignCompendiumKinds(campaignId: string, userId: string) {
    const context = await this.resolveCampaignContext(campaignId, userId);

    return {
      campaignId: context.campaignId,
      systemSlug: context.systemSlug,
      totals: getCompendiumKindTotals(context.systemSlug),
    };
  }

  listSystemCompendium(input: ListSystemCompendiumInput) {
    const entries = filterCompendiumEntries({
      systemSlug: input.systemSlug,
      kind: input.kind,
      search: input.search,
      limit: input.limit,
    });

    return {
      systemSlug: input.systemSlug,
      totals: getCompendiumKindTotals(input.systemSlug),
      entries,
    };
  }
}
