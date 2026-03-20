import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

export class LootService {
  async createLoot(sessionId: string, name: string, description: string | undefined, value: number) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        campaign: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    return prisma.$transaction(async (tx) => {
      const loot = await tx.loot.create({
        data: {
          sessionId,
          name,
          description,
          value,
        },
      });

      const recipients = new Set(session.campaign.members.map((m) => m.userId));
      recipients.add(session.campaign.ownerId);

      const notificationData = Array.from(recipients).map((userId) => ({
        userId,
        message: `New loot "${name}" added to session`,
      }));

      if (notificationData.length > 0) {
        await tx.notification.createMany({
          data: notificationData,
        });
      }

      return loot;
    });
  }

  async getLootBySession(sessionId: string) {
    const loot = await prisma.loot.findMany({
      where: { sessionId },
      include: {
        assignedToCharacter: {
          select: {
            id: true,
            name: true,
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return loot;
  }

  async updateLoot(
    lootId: string,
    data: { name?: string; description?: string; value?: number }
  ) {
    const loot = await prisma.loot.update({
      where: { id: lootId },
      data,
    });

    return loot;
  }

  async deleteLoot(lootId: string) {
    await prisma.loot.delete({
      where: { id: lootId },
    });
  }

  async assignLoot(lootId: string, characterId: string | null) {
    const loot = await prisma.loot.update({
      where: { id: lootId },
      data: {
        assignedToCharacterId: characterId,
      },
      include: {
        assignedToCharacter: {
          include: {
            player: true,
          },
        },
      },
    });

    // Notify the player if assigned
    if (characterId && loot.assignedToCharacter) {
      await prisma.notification.create({
        data: {
          userId: loot.assignedToCharacter.player.id,
          message: `Loot "${loot.name}" has been assigned to your character "${loot.assignedToCharacter.name}"`,
        },
      });
    }

    return loot;
  }
}
