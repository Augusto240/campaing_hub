import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  campaignCompendiumParamsSchema,
  compendiumQuerySchema,
  systemCompendiumParamsSchema,
  toCompendiumKind,
} from './compendium.validation';
import { CompendiumService } from './compendium.service';

const compendiumService = new CompendiumService();

/**
 * GET /api/compendium/campaign/:campaignId
 * Lista compendio interno por campanha (filtro por tipo e busca).
 */
export const getCampaignCompendium = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignCompendiumParamsSchema, req.params);
    const { kind, search, limit } = validate(compendiumQuerySchema, req.query);
    const safeLimit = typeof limit === 'number' ? limit : 60;

    const data = await compendiumService.listCampaignCompendium({
      campaignId,
      userId: req.user!.id,
      kind: toCompendiumKind(kind),
      search,
      limit: safeLimit,
    });

    res.json(success(data, 'Campaign compendium retrieved successfully'));
  }
);

/**
 * GET /api/compendium/campaign/:campaignId/kinds
 * Retorna totais por tipo no compendio da campanha.
 */
export const getCampaignCompendiumKinds = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignCompendiumParamsSchema, req.params);

    const data = await compendiumService.listCampaignCompendiumKinds(campaignId, req.user!.id);

    res.json(success(data, 'Campaign compendium kind totals retrieved successfully'));
  }
);

/**
 * GET /api/compendium/system/:systemSlug
 * Lista compendio interno publico por sistema.
 */
export const getSystemCompendium = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { systemSlug } = validate(systemCompendiumParamsSchema, req.params);
    const { kind, search, limit } = validate(compendiumQuerySchema, req.query);
    const safeLimit = typeof limit === 'number' ? limit : 60;

    const data = compendiumService.listSystemCompendium({
      systemSlug,
      kind: toCompendiumKind(kind),
      search,
      limit: safeLimit,
    });

    res.json(success(data, 'System compendium retrieved successfully'));
  }
);
