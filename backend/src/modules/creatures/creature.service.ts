import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { DEFAULT_CREATURES } from './default-creatures';

type CreaturePayload = {
  name: string;
  systemId: string;
  creatureType: string;
  stats: Record<string, unknown>;
  abilities: Record<string, unknown>;
  loot?: Record<string, unknown>;
  xpReward?: number;
  description?: string;
  isPublic?: boolean;
};

type ListCreaturesInput = {
  userId: string;
  systemId?: string;
  search?: string;
  creatureType?: string;
  includePrivate?: boolean;
};

const toInputJsonValue = (value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined => {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
};

const buildCreatureUpdateData = (payload: Partial<CreaturePayload>): Prisma.CreatureUpdateInput => {
  const data: Prisma.CreatureUpdateInput = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.systemId !== undefined) {
    data.systemTemplate = {
      connect: {
        id: payload.systemId,
      },
    };
  }

  if (payload.creatureType !== undefined) {
    data.creatureType = payload.creatureType;
  }

  if (payload.stats !== undefined) {
    data.stats = toInputJsonValue(payload.stats) ?? Prisma.JsonNull;
  }

  if (payload.abilities !== undefined) {
    data.abilities = toInputJsonValue(payload.abilities) ?? Prisma.JsonNull;
  }

  if (payload.loot !== undefined) {
    data.loot = toInputJsonValue(payload.loot) ?? Prisma.JsonNull;
  }

  if (payload.xpReward !== undefined) {
    data.xpReward = payload.xpReward;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.isPublic !== undefined) {
    data.isPublic = payload.isPublic;
  }

  return data;
};

export class CreatureService {
  async ensureDefaultCreatures(createdBy: string): Promise<void> {
    const systems = await prisma.rpgSystem.findMany({
      select: { id: true, slug: true },
    });

    for (const system of systems) {
      const creatures = DEFAULT_CREATURES[system.slug] ?? [];

      for (const creature of creatures) {
        await prisma.creature.upsert({
          where: {
            systemId_name: {
              systemId: system.id,
              name: creature.name,
            },
          },
          update: {
            creatureType: creature.creatureType,
            stats: toInputJsonValue(creature.stats) ?? Prisma.JsonNull,
            abilities: toInputJsonValue(creature.abilities) ?? Prisma.JsonNull,
            loot: toInputJsonValue(creature.loot),
            xpReward: creature.xpReward,
            description: creature.description,
            isPublic: true,
          },
          create: {
            name: creature.name,
            systemId: system.id,
            creatureType: creature.creatureType,
            stats: toInputJsonValue(creature.stats) ?? Prisma.JsonNull,
            abilities: toInputJsonValue(creature.abilities) ?? Prisma.JsonNull,
            loot: toInputJsonValue(creature.loot),
            xpReward: creature.xpReward,
            description: creature.description,
            isPublic: true,
            createdBy,
          },
        });
      }
    }
  }

  async listCreatures(input: ListCreaturesInput) {
    await this.ensureDefaultCreatures(input.userId);

    return prisma.creature.findMany({
      where: {
        ...(input.systemId ? { systemId: input.systemId } : {}),
        ...(input.search
          ? {
              name: {
                contains: input.search,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(input.creatureType ? { creatureType: input.creatureType } : {}),
        ...(input.includePrivate
          ? {
              OR: [{ isPublic: true }, { createdBy: input.userId }],
            }
          : {
              isPublic: true,
            }),
      },
      include: {
        systemTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ systemTemplate: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async getCreatureById(userId: string, creatureId: string) {
    const creature = await prisma.creature.findUnique({
      where: { id: creatureId },
      include: {
        systemTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!creature) {
      throw new AppError(404, 'Creature not found');
    }

    if (!creature.isPublic && creature.createdBy !== userId) {
      throw new AppError(403, 'You are not allowed to view this creature');
    }

    return creature;
  }

  async createCreature(userId: string, payload: CreaturePayload) {
    return prisma.creature.create({
      data: {
        name: payload.name,
        systemId: payload.systemId,
        creatureType: payload.creatureType,
        stats: toInputJsonValue(payload.stats) ?? Prisma.JsonNull,
        abilities: toInputJsonValue(payload.abilities) ?? Prisma.JsonNull,
        loot: toInputJsonValue(payload.loot),
        xpReward: payload.xpReward,
        description: payload.description,
        isPublic: payload.isPublic ?? false,
        createdBy: userId,
      },
      include: {
        systemTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async updateCreature(userId: string, creatureId: string, payload: Partial<CreaturePayload>) {
    const existing = await prisma.creature.findUnique({
      where: { id: creatureId },
    });

    if (!existing) {
      throw new AppError(404, 'Creature not found');
    }

    if (existing.createdBy !== userId) {
      throw new AppError(403, 'Only the creator can update this creature');
    }

    return prisma.creature.update({
      where: { id: creatureId },
      data: buildCreatureUpdateData(payload),
      include: {
        systemTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
