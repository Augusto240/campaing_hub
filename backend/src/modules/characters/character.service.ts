import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { calculateLevelFromXP } from '../../utils/xp-calculator';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export class CharacterService {
  async createCharacter(playerId: string, campaignId: string, name: string, charClass: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId: playerId },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    if (campaign.ownerId !== playerId && campaign.members.length === 0) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    return prisma.$transaction(async (tx) => {
      const character = await tx.character.create({
        data: {
          name,
          class: charClass,
          playerId,
          campaignId,
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (campaign.ownerId !== playerId) {
        await tx.notification.create({
          data: {
            userId: campaign.ownerId,
            message: `New character "${name}" created in your campaign`,
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
        loot: true,
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    return character;
  }

  async updateCharacter(
    characterId: string,
    data: { name?: string; class?: string; level?: number; xp?: number }
  ) {
    const normalizedData = { ...data };

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
      },
    });
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
