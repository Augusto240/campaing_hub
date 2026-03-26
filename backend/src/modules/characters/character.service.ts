import { Prisma } from '@prisma/client';
import { sanityChecksTotal } from '../../config/metrics';
import { emitCampaignEvent } from '../../config/realtime';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { calculateLevelFromXP } from '../../utils/xp-calculator';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;
type JsonValue = string | number | boolean | null;
type JsonObject = Record<string, JsonValue>;

interface CharacterCreationInput {
  campaignId: string;
  name: string;
  class: string;
  attributes?: JsonObject;
  resources?: JsonObject;
  inventory?: JsonObject[];
  notes?: string;
  imageUrl?: string;
}

interface CharacterUpdateInput {
  name?: string;
  class?: string;
  level?: number;
  xp?: number;
  attributes?: JsonObject;
  resources?: JsonObject;
  inventory?: JsonObject[];
  notes?: string;
  imageUrl?: string;
}

interface SanityCheckInput {
  roll: number;
  difficulty: number;
  trigger: string;
  sessionId?: string;
  successLoss: number;
  failedLoss: number;
}

interface SpellCastInput {
  spellName: string;
  manaCost: number;
  faithCost: number;
  result?: string;
  sessionId?: string;
}

const toJsonObject = (value: Prisma.JsonValue | null | undefined): JsonObject => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const jsonObject = value as Record<string, unknown>;
  const normalized: JsonObject = {};

  Object.entries(jsonObject).forEach(([key, rawValue]) => {
    if (
      typeof rawValue === 'string' ||
      typeof rawValue === 'number' ||
      typeof rawValue === 'boolean' ||
      rawValue === null
    ) {
      normalized[key] = rawValue;
    }
  });

  return normalized;
};

const readNumericResource = (resources: JsonObject, keys: string[], fallback = 0): number => {
  for (const key of keys) {
    const value = resources[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
};

const buildDefaultResources = (campaignSystem: {
  hasMana: boolean;
  hasSanity: boolean;
} | null): JsonObject => {
  const defaults: JsonObject = {
    hp: 10,
    maxHp: 10,
  };

  if (campaignSystem?.hasMana) {
    defaults.mana = 0;
    defaults.maxMana = 0;
    defaults.faith = 0;
  }

  if (campaignSystem?.hasSanity) {
    defaults.sanity = 99;
    defaults.maxSanity = 99;
  }

  return defaults;
};

export class CharacterService {
  async createCharacter(playerId: string, input: CharacterCreationInput) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      include: {
        members: {
          where: { userId: playerId },
        },
        systemTemplate: {
          select: {
            id: true,
            hasMana: true,
            hasSanity: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    if (campaign.ownerId !== playerId && campaign.members.length === 0) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    const defaultResources = buildDefaultResources(campaign.systemTemplate);

    return prisma.$transaction(async (tx) => {
      const character = await tx.character.create({
        data: {
          name: input.name,
          class: input.class,
          playerId,
          campaignId: input.campaignId,
          systemId: campaign.systemId,
          attributes: input.attributes ?? {},
          resources: {
            ...defaultResources,
            ...(input.resources ?? {}),
          },
          inventory: input.inventory ?? [],
          notes: input.notes,
          imageUrl: input.imageUrl,
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          systemTemplate: true,
        },
      });

      if (campaign.ownerId !== playerId) {
        await tx.notification.create({
          data: {
            userId: campaign.ownerId,
            message: `New character "${input.name}" created in your campaign`,
          },
        });
      }

      return character;
    });
  }

  async getCharactersByCampaign(campaignId: string) {
    return prisma.character.findMany({
      where: { campaignId },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        systemTemplate: true,
        loot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCharacterById(characterId: string) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            system: true,
          },
        },
        systemTemplate: true,
        sanityEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        spellCasts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        loot: true,
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    return character;
  }

  async updateCharacter(characterId: string, data: CharacterUpdateInput) {
    const normalizedData: CharacterUpdateInput = { ...data };

    if (typeof normalizedData.xp === 'number' && typeof normalizedData.level !== 'number') {
      normalizedData.level = calculateLevelFromXP(normalizedData.xp);
    }

    return prisma.character.update({
      where: { id: characterId },
      data: normalizedData,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        systemTemplate: true,
      },
    });
  }

  async updateResources(characterId: string, resourcesPatch: JsonObject) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        campaignId: true,
        resources: true,
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    const currentResources = toJsonObject(character.resources);
    const mergedResources = {
      ...currentResources,
      ...resourcesPatch,
    };

    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: {
        resources: mergedResources,
      },
      select: {
        id: true,
        name: true,
        resources: true,
      },
    });

    emitCampaignEvent(character.campaignId, 'character:resources_updated', {
      characterId: updatedCharacter.id,
      characterName: updatedCharacter.name,
      resources: updatedCharacter.resources,
    });

    return updatedCharacter;
  }

  async deleteCharacter(characterId: string) {
    await prisma.character.delete({
      where: { id: characterId },
    });
  }

  async uploadSheet(characterId: string, filePath: string) {
    return prisma.character.update({
      where: { id: characterId },
      data: {
        sheetFileUrl: filePath,
      },
    });
  }

  async getSanityEvents(characterId: string) {
    return prisma.sanityEvent.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    });
  }

  async getSpellCasts(characterId: string) {
    return prisma.spellCast.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    });
  }

  async performSanityCheck(characterId: string, payload: SanityCheckInput) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        campaign: {
          select: {
            id: true,
          },
        },
        systemTemplate: {
          select: {
            hasSanity: true,
          },
        },
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    if (!character.systemTemplate?.hasSanity) {
      throw new AppError(
        400,
        'Sanity checks are available only for systems with sanity enabled',
        true,
        'SYSTEM_RULE_VIOLATION'
      );
    }

    if (payload.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        select: { campaignId: true },
      });

      if (!session) {
        throw new AppError(404, 'Session not found');
      }

      if (session.campaignId !== character.campaignId) {
        throw new AppError(
          400,
          'Session must belong to the same campaign as the character',
          true,
          'INVALID_RELATION'
        );
      }
    }

    const resources = toJsonObject(character.resources);
    const currentSanity = readNumericResource(resources, ['sanity', 'SAN', 'san'], 99);

    const sanityLoss =
      payload.roll <= payload.difficulty
        ? payload.successLoss
        : Math.min(20, payload.failedLoss + Math.floor((payload.roll - payload.difficulty) / 20));

    const newSanity = Math.max(0, currentSanity - sanityLoss);
    const tempInsanity = sanityLoss >= 5 ? 'Temporary insanity triggered' : null;
    const permInsanity = newSanity === 0 ? 'Permanent insanity triggered' : null;

    const result = await prisma.$transaction(async (tx) => {
      const sanityEvent = await tx.sanityEvent.create({
        data: {
          characterId,
          sessionId: payload.sessionId,
          trigger: payload.trigger,
          sanityLost: sanityLoss,
          tempInsanity,
          permInsanity,
        },
      });

      const updatedCharacter = await tx.character.update({
        where: { id: characterId },
        data: {
          resources: {
            ...resources,
            sanity: newSanity,
          },
        },
        select: {
          id: true,
          name: true,
          resources: true,
        },
      });

      if (sanityLoss > 0) {
        await tx.notification.create({
          data: {
            userId: character.playerId,
            message: `Sanity check: "${character.name}" lost ${sanityLoss} sanity.`,
          },
        });
      }

      return {
        sanityEvent,
        character: updatedCharacter,
      };
    });

    sanityChecksTotal.inc();
    emitCampaignEvent(character.campaignId, 'character:sanity_changed', {
      characterId: result.character.id,
      characterName: result.character.name,
      newSanity: toJsonObject(result.character.resources).sanity ?? newSanity,
      sanityLost: result.sanityEvent.sanityLost,
      trigger: result.sanityEvent.trigger,
      tempInsanity: result.sanityEvent.tempInsanity ?? null,
      permInsanity: result.sanityEvent.permInsanity ?? null,
    });

    return result;
  }

  async castSpell(characterId: string, payload: SpellCastInput) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        systemTemplate: {
          select: {
            hasMana: true,
          },
        },
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    if (!character.systemTemplate?.hasMana) {
      throw new AppError(
        400,
        'Spell casting with mana is available only for systems with mana enabled',
        true,
        'SYSTEM_RULE_VIOLATION'
      );
    }

    const resources = toJsonObject(character.resources);
    const currentMana = readNumericResource(resources, ['mana', 'currentMana'], 0);
    const currentFaith = readNumericResource(resources, ['faith', 'faithPoints'], 0);

    if (payload.manaCost > currentMana) {
      throw new AppError(400, 'Not enough mana', true, 'INSUFFICIENT_MANA');
    }

    if (payload.faithCost > currentFaith) {
      throw new AppError(400, 'Not enough faith points', true, 'INSUFFICIENT_FAITH');
    }

    if (payload.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        select: { campaignId: true },
      });

      if (!session) {
        throw new AppError(404, 'Session not found');
      }

      if (session.campaignId !== character.campaignId) {
        throw new AppError(
          400,
          'Session must belong to the same campaign as the character',
          true,
          'INVALID_RELATION'
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const spellCast = await tx.spellCast.create({
        data: {
          characterId,
          sessionId: payload.sessionId,
          spellName: payload.spellName,
          manaCost: payload.manaCost,
          faithCost: payload.faithCost,
          result: payload.result,
        },
      });

      const updatedCharacter = await tx.character.update({
        where: { id: characterId },
        data: {
          resources: {
            ...resources,
            mana: currentMana - payload.manaCost,
            faith: currentFaith - payload.faithCost,
          },
        },
        select: {
          id: true,
          name: true,
          resources: true,
        },
      });

      return {
        spellCast,
        character: updatedCharacter,
      };
    });

    emitCampaignEvent(character.campaignId, 'character:resources_updated', {
      characterId: result.character.id,
      characterName: result.character.name,
      resources: result.character.resources,
    });

    emitCampaignEvent(character.campaignId, 'character:spell_cast', {
      characterId: result.character.id,
      characterName: result.character.name,
      spellName: result.spellCast.spellName,
      manaCost: result.spellCast.manaCost,
      faithCost: result.spellCast.faithCost,
      result: result.spellCast.result ?? null,
      sessionId: result.spellCast.sessionId ?? null,
      createdAt: result.spellCast.createdAt,
    });

    return result;
  }

  async addXP(characterId: string, xpAmount: number, client: PrismaClientLike = prisma) {
    return this.addXPWithClient(client, characterId, xpAmount);
  }

  private async addXPWithClient(client: PrismaClientLike, characterId: string, xpAmount: number) {
    if (xpAmount < 0) {
      throw new AppError(400, 'XP amount cannot be negative');
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const character = await client.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        throw new AppError(404, 'Character not found');
      }

      const newXP = character.xp + xpAmount;
      const newLevel = calculateLevelFromXP(newXP);
      const leveledUp = newLevel > character.level;

      const updated = await client.character.updateMany({
        where: {
          id: characterId,
          version: character.version,
        },
        data: {
          xp: newXP,
          level: newLevel,
          version: {
            increment: 1,
          },
        },
      });

      if (updated.count === 0) {
        if (attempt < 2) {
          continue;
        }

        throw new AppError(
          409,
          'Character update conflict. Please retry the request.',
          true,
          'CONFLICT'
        );
      }

      const updatedCharacter = await client.character.findUnique({
        where: { id: characterId },
      });

      if (!updatedCharacter) {
        throw new AppError(404, 'Character not found after update');
      }

      if (leveledUp) {
        await client.notification.create({
          data: {
            userId: character.playerId,
            message: `Your character "${character.name}" leveled up to level ${newLevel}!`,
          },
        });
      }

      return { character: updatedCharacter, leveledUp };
    }

    throw new AppError(409, 'Character update conflict. Please retry the request.', true, 'CONFLICT');
  }
}
