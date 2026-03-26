import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  addCombatantSchema,
  combatantIdParamsSchema,
  createEncounterSchema,
  encounterIdParamsSchema,
  reorderCombatantsSchema,
  sessionIdParamsSchema,
  updateCombatantSchema,
} from './combat.validation';
import { CombatService } from './combat.service';

const combatService = new CombatService();

/**
 * POST /api/sessions/:sessionId/combat
 * Cria encontro de combate para a sessao.
 */
export const createCombatEncounter = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);
    const payload = validate(createEncounterSchema, req.body);
    const encounter = await combatService.createEncounter(sessionId, payload);

    res.status(201).json(success(encounter, 'Combat encounter created successfully'));
  }
);

/**
 * GET /api/sessions/:sessionId/combat
 * Lista encontros de combate da sessao.
 */
export const listSessionEncounters = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);
    const encounters = await combatService.listBySession(sessionId);

    res.json(success(encounters, 'Combat encounters retrieved successfully'));
  }
);

/**
 * GET /api/combat/:encounterId
 * Retorna detalhes do encontro de combate.
 */
export const getCombatEncounter = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { encounterId } = validate(encounterIdParamsSchema, req.params);
    const encounter = await combatService.getEncounter(encounterId);

    res.json(success(encounter, 'Combat encounter retrieved successfully'));
  }
);

/**
 * PATCH /api/combat/:encounterId/next-turn
 * Avanca o tracker de iniciativa para o proximo turno.
 */
export const advanceCombatTurn = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { encounterId } = validate(encounterIdParamsSchema, req.params);
    const encounter = await combatService.nextTurn(encounterId);

    res.json(success(encounter, 'Combat turn advanced successfully'));
  }
);

/**
 * PATCH /api/combat/:encounterId/reorder
 * Reordena a fila de iniciativa.
 */
export const reorderCombatants = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { encounterId } = validate(encounterIdParamsSchema, req.params);
    const { combatantIds } = validate(reorderCombatantsSchema, req.body);
    const encounter = await combatService.reorderCombatants(encounterId, combatantIds);

    res.json(success(encounter, 'Combatants reordered successfully'));
  }
);

/**
 * PATCH /api/combat/:encounterId/combatants/:combatantId
 * Atualiza HP, condicoes e metadados de um combatente.
 */
export const updateCombatant = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { encounterId, combatantId } = validate(combatantIdParamsSchema, req.params);
    const payload = validate(updateCombatantSchema, req.body);
    const combatant = await combatService.updateCombatant(encounterId, combatantId, payload);

    res.json(success(combatant, 'Combatant updated successfully'));
  }
);

/**
 * POST /api/combat/:encounterId/combatants
 * Adiciona combatente ao encontro.
 */
export const addCombatant = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { encounterId } = validate(encounterIdParamsSchema, req.params);
    const payload = validate(addCombatantSchema, req.body);
    const combatant = await combatService.addCombatant(encounterId, payload);

    res.status(201).json(success(combatant, 'Combatant added successfully'));
  }
);
