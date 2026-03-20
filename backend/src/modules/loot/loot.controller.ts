import { Response, NextFunction } from 'express';
import { LootService } from './loot.service';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { validate } from '../../utils/validation';
import {
  assignLootSchema,
  createLootSchema,
  lootIdParamsSchema,
  sessionIdParamsSchema,
  updateLootSchema,
} from './loot.validation';

const lootService = new LootService();

export const createLoot = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sessionId, name, description, value } = validate(createLootSchema, req.body);

    const loot = await lootService.createLoot(sessionId, name, description, value || 0);

    res.status(201).json(success(loot, 'Loot created successfully'));
  }
);

export const getLoot = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);

    const loot = await lootService.getLootBySession(sessionId);

    res.json(success(loot, 'Loot retrieved successfully'));
  }
);

export const updateLoot = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { lootId } = validate(lootIdParamsSchema, req.params);
    const { name, description, value } = validate(updateLootSchema, req.body);

    const loot = await lootService.updateLoot(lootId, { name, description, value });

    res.json(success(loot, 'Loot updated successfully'));
  }
);

export const deleteLoot = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { lootId } = validate(lootIdParamsSchema, req.params);

    await lootService.deleteLoot(lootId);

    res.json(success(null, 'Loot deleted successfully'));
  }
);

export const assignLoot = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { lootId } = validate(lootIdParamsSchema, req.params);
    const { characterId } = validate(assignLootSchema, req.body);

    const loot = await lootService.assignLoot(lootId, characterId);

    res.json(success(loot, 'Loot assigned successfully'));
  }
);
