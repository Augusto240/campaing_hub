import { prisma } from '../../config/database';
import { emitCampaignEvent } from '../../config/realtime';
import { AppError } from '../../utils/error-handler';

type CombatantInput = {
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isNpc?: boolean;
  characterId?: string;
  conditions?: string[];
  notes?: string;
};

type UpdateCombatantInput = Partial<CombatantInput>;

export class CombatService {
  async createEncounter(sessionId: string, payload: { name: string; combatants: CombatantInput[] }) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, campaignId: true },
    });

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    for (const combatant of payload.combatants) {
      if (combatant.characterId) {
        const character = await prisma.character.findUnique({
          where: { id: combatant.characterId },
          select: { campaignId: true },
        });

        if (!character || character.campaignId !== session.campaignId) {
          throw new AppError(400, 'Combatant character must belong to the same campaign');
        }
      }
    }

    const encounter = await prisma.$transaction(async (tx) => {
      return tx.combatEncounter.create({
        data: {
          sessionId,
          name: payload.name,
          combatants: {
            create: payload.combatants.map((combatant, index) => ({
              name: combatant.name,
              initiative: combatant.initiative,
              hp: combatant.hp,
              maxHp: combatant.maxHp,
              isNpc: combatant.isNpc ?? false,
              characterId: combatant.characterId,
              conditions: combatant.conditions ?? [],
              notes: combatant.notes,
              order: index,
            })),
          },
        },
        include: {
          combatants: {
            orderBy: [{ order: 'asc' }, { initiative: 'desc' }],
          },
          session: {
            select: { id: true, campaignId: true },
          },
        },
      });
    });

    emitCampaignEvent(session.campaignId, 'combat:created', encounter);
    return encounter;
  }

  async listBySession(sessionId: string) {
    return prisma.combatEncounter.findMany({
      where: { sessionId },
      include: {
        combatants: {
          orderBy: [{ order: 'asc' }, { initiative: 'desc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEncounter(encounterId: string) {
    const encounter = await prisma.combatEncounter.findUnique({
      where: { id: encounterId },
      include: {
        combatants: {
          orderBy: [{ order: 'asc' }, { initiative: 'desc' }],
        },
        session: {
          select: { campaignId: true },
        },
      },
    });

    if (!encounter) {
      throw new AppError(404, 'Combat encounter not found');
    }

    return encounter;
  }

  async nextTurn(encounterId: string) {
    const encounter = await this.getEncounter(encounterId);

    if (encounter.combatants.length === 0) {
      throw new AppError(400, 'Encounter has no combatants');
    }

    const isLastTurn = encounter.currentTurn >= encounter.combatants.length - 1;
    const updatedEncounter = await prisma.combatEncounter.update({
      where: { id: encounterId },
      data: {
        currentTurn: isLastTurn ? 0 : encounter.currentTurn + 1,
        round: isLastTurn ? encounter.round + 1 : encounter.round,
      },
      include: {
        combatants: {
          orderBy: [{ order: 'asc' }, { initiative: 'desc' }],
        },
        session: {
          select: { campaignId: true },
        },
      },
    });

    emitCampaignEvent(updatedEncounter.session.campaignId, 'combat:turn_changed', {
      encounterId: updatedEncounter.id,
      currentTurn: updatedEncounter.currentTurn,
      round: updatedEncounter.round,
      activeCombatant: updatedEncounter.combatants[updatedEncounter.currentTurn] ?? null,
    });

    return updatedEncounter;
  }

  async reorderCombatants(encounterId: string, combatantIds: string[]) {
    const encounter = await this.getEncounter(encounterId);
    const encounterCombatantIds = new Set(encounter.combatants.map((combatant) => combatant.id));

    if (combatantIds.length !== encounter.combatants.length) {
      throw new AppError(400, 'Combatant ordering must include all encounter combatants');
    }

    if (combatantIds.some((combatantId) => !encounterCombatantIds.has(combatantId))) {
      throw new AppError(400, 'Combatant ordering contains invalid combatants');
    }

    await prisma.$transaction(
      combatantIds.map((combatantId, index) =>
        prisma.combatant.update({
          where: { id: combatantId },
          data: { order: index },
        })
      )
    );

    const updatedEncounter = await this.getEncounter(encounterId);
    emitCampaignEvent(updatedEncounter.session.campaignId, 'combat:updated', updatedEncounter);
    return updatedEncounter;
  }

  async updateCombatant(encounterId: string, combatantId: string, payload: UpdateCombatantInput) {
    const encounter = await this.getEncounter(encounterId);
    const combatant = encounter.combatants.find((item) => item.id === combatantId);

    if (!combatant) {
      throw new AppError(404, 'Combatant not found');
    }

    const updatedCombatant = await prisma.combatant.update({
      where: { id: combatantId },
      data: payload,
    });

    emitCampaignEvent(encounter.session.campaignId, 'combat:updated', {
      encounterId,
      combatant: updatedCombatant,
    });

    return updatedCombatant;
  }

  async addCombatant(encounterId: string, payload: CombatantInput) {
    const encounter = await this.getEncounter(encounterId);
    const nextOrder = encounter.combatants.length;

    if (payload.characterId) {
      const character = await prisma.character.findUnique({
        where: { id: payload.characterId },
        select: { campaignId: true },
      });

      if (!character || character.campaignId !== encounter.session.campaignId) {
        throw new AppError(400, 'Combatant character must belong to the same campaign');
      }
    }

    const combatant = await prisma.combatant.create({
      data: {
        encounterId,
        name: payload.name,
        initiative: payload.initiative,
        hp: payload.hp,
        maxHp: payload.maxHp,
        isNpc: payload.isNpc ?? false,
        characterId: payload.characterId,
        conditions: payload.conditions ?? [],
        notes: payload.notes,
        order: nextOrder,
      },
    });

    emitCampaignEvent(encounter.session.campaignId, 'combat:updated', {
      encounterId,
      combatant,
    });

    return combatant;
  }
}
