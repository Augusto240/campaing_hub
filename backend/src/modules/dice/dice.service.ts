import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { parseAndRollDice } from '../../utils/dice-parser';

interface CreateDiceRollInput {
  userId: string;
  campaignId: string;
  sessionId?: string;
  characterId?: string;
  formula: string;
  label?: string;
  isPrivate: boolean;
}

interface ListDiceRollsInput {
  userId: string;
  campaignId: string;
  sessionId?: string;
  limit: number;
}

export class DiceService {
  async createRoll(input: CreateDiceRollInput) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      include: {
        members: {
          where: { userId: input.userId },
          select: { role: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const isCampaignMember =
      campaign.ownerId === input.userId || campaign.members.length > 0;

    if (!isCampaignMember) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    if (input.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: input.sessionId },
        select: { campaignId: true },
      });

      if (!session) {
        throw new AppError(404, 'Session not found');
      }

      if (session.campaignId !== input.campaignId) {
        throw new AppError(400, 'Session must belong to the same campaign', true, 'INVALID_RELATION');
      }
    }

    let parserContext:
      | {
          attributes?: Record<string, unknown>;
          modifierFormula?: string;
        }
      | undefined;

    if (/[+-][a-z]{2,10}$/i.test(input.formula.trim())) {
      if (!input.characterId) {
        throw new AppError(
          400,
          'characterId is required when formula references attribute modifiers',
          true,
          'CHARACTER_REQUIRED'
        );
      }

      const character = await prisma.character.findUnique({
        where: { id: input.characterId },
        include: {
          systemTemplate: {
            select: {
              attributeSchema: true,
            },
          },
        },
      });

      if (!character) {
        throw new AppError(404, 'Character not found');
      }

      if (character.campaignId !== input.campaignId) {
        throw new AppError(400, 'Character must belong to the same campaign', true, 'INVALID_RELATION');
      }

      const attributeSchema = character.systemTemplate?.attributeSchema;
      const modifierFormula =
        attributeSchema &&
        typeof attributeSchema === 'object' &&
        !Array.isArray(attributeSchema) &&
        typeof (attributeSchema as Record<string, unknown>).modifierFormula === 'string'
          ? String((attributeSchema as Record<string, unknown>).modifierFormula)
          : undefined;

      parserContext = {
        attributes:
          character.attributes &&
          typeof character.attributes === 'object' &&
          !Array.isArray(character.attributes)
            ? (character.attributes as Record<string, unknown>)
            : undefined,
        modifierFormula,
      };
    } else if (input.characterId) {
      const character = await prisma.character.findUnique({
        where: { id: input.characterId },
        select: { campaignId: true },
      });
      if (!character) {
        throw new AppError(404, 'Character not found');
      }
      if (character.campaignId !== input.campaignId) {
        throw new AppError(400, 'Character must belong to the same campaign', true, 'INVALID_RELATION');
      }
    }

    const rolled = parseAndRollDice(input.formula, parserContext);

    return prisma.diceRoll.create({
      data: {
        campaignId: input.campaignId,
        sessionId: input.sessionId,
        userId: input.userId,
        characterId: input.characterId,
        formula: rolled.normalizedFormula,
        result: rolled.result,
        breakdown: rolled.breakdown,
        label: input.label,
        isPrivate: input.isPrivate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        character: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async listCampaignRolls(input: ListDiceRollsInput) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      include: {
        members: {
          where: { userId: input.userId },
          select: { role: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const isGm =
      campaign.ownerId === input.userId ||
      campaign.members.some((member) => member.role === 'GM');

    return prisma.diceRoll.findMany({
      where: {
        campaignId: input.campaignId,
        ...(input.sessionId ? { sessionId: input.sessionId } : {}),
        ...(isGm
          ? {}
          : {
              OR: [{ isPrivate: false }, { userId: input.userId }],
            }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        character: {
          select: {
            id: true,
            name: true,
          },
        },
        session: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: input.limit,
    });
  }
}

