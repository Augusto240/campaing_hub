import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  coreBacklinksQuerySchema,
  coreCampaignParamsSchema,
  coreCompendiumQuerySchema,
  coreCreateHomebrewSchema,
  coreCreatePageSchema,
  coreSearchQuerySchema,
  coreSnapshotQuerySchema,
  coreUpsertBlocksSchema,
  coreUpsertVttStateSchema,
  coreWikiPageParamsSchema,
} from './core.validation';
import { CoreService } from './core.service';

const coreService = new CoreService();

export const getCoreCampaignSnapshot = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);
    const { limit } = validate(coreSnapshotQuerySchema, req.query);

    const snapshot = await coreService.getCampaignSnapshot(campaignId, req.user!.id, limit ?? 160);

    res.json(success(snapshot, 'Core campaign snapshot retrieved successfully'));
  }
);

export const createCorePage = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);
    const payload = validate(coreCreatePageSchema, req.body);

    const createdPage = await coreService.createPage({
      campaignId,
      userId: req.user!.id,
      parentPageId: payload.parentPageId,
      title: payload.title,
      content: payload.content,
      category: payload.category,
      tags: payload.tags ?? [],
      isPublic: payload.isPublic ?? true,
      blocks: payload.blocks ?? [],
    });

    res.status(201).json(success(createdPage, 'Core page created successfully'));
  }
);

export const upsertCorePageBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(coreWikiPageParamsSchema, req.params);
    const { blocks } = validate(coreUpsertBlocksSchema, req.body);

    const updated = await coreService.upsertPageBlocks({
      wikiPageId,
      userId: req.user!.id,
      blocks,
    });

    res.json(success(updated, 'Core page blocks updated successfully'));
  }
);

export const getCoreBacklinks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(coreWikiPageParamsSchema, req.params);
    const { limit } = validate(coreBacklinksQuerySchema, req.query);

    const backlinks = await coreService.listBacklinks({
      wikiPageId,
      userId: req.user!.id,
      limit: limit ?? 12,
    });

    res.json(success(backlinks, 'Core backlinks retrieved successfully'));
  }
);

export const searchCoreKnowledge = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);
    const { query, limit } = validate(coreSearchQuerySchema, req.query);

    const searchResult = await coreService.searchKnowledge({
      campaignId,
      userId: req.user!.id,
      query,
      limit: limit ?? 40,
    });

    res.json(success(searchResult, 'Core knowledge search completed successfully'));
  }
);

export const getCoreCompendium = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);
    const { kind, search, limit } = validate(coreCompendiumQuerySchema, req.query);

    const compendium = await coreService.listCompendium({
      campaignId,
      userId: req.user!.id,
      kind,
      search,
      limit: limit ?? 80,
    });

    res.json(success(compendium, 'Core compendium retrieved successfully'));
  }
);

export const createCoreHomebrewEntry = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);
    const payload = validate(coreCreateHomebrewSchema, req.body);

    const createdEntry = await coreService.createHomebrewEntry({
      campaignId,
      userId: req.user!.id,
      kind: payload.kind,
      name: payload.name,
      summary: payload.summary,
      tags: payload.tags ?? [],
      content: payload.content ?? {},
      source: payload.source,
      linkedWikiPageIds: payload.linkedWikiPageIds ?? [],
    });

    res.status(201).json(success(createdEntry, 'Core homebrew entry created successfully'));
  }
);

export const getCoreVttState = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);

    const state = await coreService.getVttState(campaignId, req.user!.id);

    res.json(success(state, 'Core VTT state retrieved successfully'));
  }
);

export const upsertCoreVttState = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(coreCampaignParamsSchema, req.params);
    const payload = validate(coreUpsertVttStateSchema, req.body);

    const state = await coreService.upsertVttState({
      campaignId,
      userId: req.user!.id,
      sessionId: payload.sessionId,
      mapImageUrl: payload.mapImageUrl,
      gridSize: payload.gridSize,
      tokens: payload.tokens,
      fog: payload.fog,
      lights: payload.lights,
    });

    res.json(success(state, 'Core VTT state updated successfully'));
  }
);
