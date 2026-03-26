import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  createCreatureSchema,
  creatureIdParamsSchema,
  listCreaturesQuerySchema,
  updateCreatureSchema,
} from './creature.validation';
import { CreatureService } from './creature.service';

const creatureService = new CreatureService();

/**
 * GET /api/creatures
 * Lista compendio pesquisavel de criaturas por sistema e tipo.
 */
export const listCreatures = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const query = validate(listCreaturesQuerySchema, req.query);
    const creatures = await creatureService.listCreatures({
      userId: req.user!.id,
      systemId: query.systemId,
      search: query.search,
      creatureType: query.creatureType,
      includePrivate: query.includePrivate,
    });

    res.json(success(creatures, 'Creatures retrieved successfully'));
  }
);

/**
 * GET /api/creatures/:creatureId
 * Retorna detalhes da criatura do compendio.
 */
export const getCreatureById = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { creatureId } = validate(creatureIdParamsSchema, req.params);
    const creature = await creatureService.getCreatureById(req.user!.id, creatureId);

    res.json(success(creature, 'Creature retrieved successfully'));
  }
);

/**
 * POST /api/creatures
 * Cria criatura customizada no compendio.
 */
export const createCreature = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const payload = validate(createCreatureSchema, req.body);
    const creature = await creatureService.createCreature(req.user!.id, payload);

    res.status(201).json(success(creature, 'Creature created successfully'));
  }
);

/**
 * PUT /api/creatures/:creatureId
 * Atualiza criatura customizada criada pelo usuario.
 */
export const updateCreature = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { creatureId } = validate(creatureIdParamsSchema, req.params);
    const payload = validate(updateCreatureSchema, req.body);
    const creature = await creatureService.updateCreature(req.user!.id, creatureId, payload);

    res.json(success(creature, 'Creature updated successfully'));
  }
);
