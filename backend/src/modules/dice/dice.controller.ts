import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  campaignIdParamsSchema,
  createDiceRollSchema,
  listDiceRollsQuerySchema,
} from './dice.validation';
import { DiceService } from './dice.service';

const diceService = new DiceService();

/**
 * POST /api/dice/roll
 * Executa rolagem e persiste historico no banco.
 */
export const createDiceRoll = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId, sessionId, characterId, formula, label, isPrivate } = validate(
      createDiceRollSchema,
      req.body
    );

    const roll = await diceService.createRoll({
      userId: req.user!.id,
      campaignId,
      sessionId,
      characterId,
      formula,
      label,
      isPrivate: isPrivate ?? false,
    });

    res.status(201).json(success(roll, 'Dice roll created successfully'));
  }
);

/**
 * GET /api/dice/campaign/:campaignId
 * Lista historico de rolagens da campanha.
 */
export const getCampaignDiceRolls = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { sessionId, limit } = validate(listDiceRollsQuerySchema, req.query);

    const rolls = await diceService.listCampaignRolls({
      userId: req.user!.id,
      campaignId,
      sessionId,
      limit: limit ?? 100,
    });

    res.json(success(rolls, 'Dice rolls retrieved successfully'));
  }
);
