import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  campaignIdParamsSchema,
  createWikiPageSchema,
  listWikiPagesQuerySchema,
  updateWikiPageSchema,
  wikiPageIdParamsSchema,
} from './wiki.validation';
import { WikiService } from './wiki.service';

const wikiService = new WikiService();

/**
 * GET /api/wiki/campaign/:campaignId
 * Lista paginas wiki da campanha com filtros.
 */
export const getCampaignWikiPages = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { category, search, tag, limit } = validate(listWikiPagesQuerySchema, req.query);

    const pages = await wikiService.listPages({
      campaignId,
      userId: req.user!.id,
      category,
      search,
      tag,
      limit: limit ?? 100,
    });

    res.json(success(pages, 'Wiki pages retrieved successfully'));
  }
);

/**
 * GET /api/wiki/:wikiPageId
 * Retorna uma pagina wiki.
 */
export const getWikiPageById = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    const page = await wikiService.getPage(wikiPageId, req.user!.id);

    res.json(success(page, 'Wiki page retrieved successfully'));
  }
);

/**
 * POST /api/wiki
 * Cria pagina wiki.
 */
export const createWikiPage = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId, title, content, category, tags, isPublic } = validate(
      createWikiPageSchema,
      req.body
    );

    const page = await wikiService.createPage({
      campaignId,
      userId: req.user!.id,
      title,
      content,
      category,
      tags: tags ?? [],
      isPublic: isPublic ?? true,
    });

    res.status(201).json(success(page, 'Wiki page created successfully'));
  }
);

/**
 * PUT /api/wiki/:wikiPageId
 * Atualiza pagina wiki.
 */
export const updateWikiPage = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);
    const { title, content, category, tags, isPublic } = validate(updateWikiPageSchema, req.body);

    const page = await wikiService.updatePage({
      userId: req.user!.id,
      wikiPageId,
      title,
      content,
      category,
      tags,
      isPublic,
    });

    res.json(success(page, 'Wiki page updated successfully'));
  }
);

/**
 * DELETE /api/wiki/:wikiPageId
 * Remove pagina wiki.
 */
export const deleteWikiPage = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    await wikiService.deletePage(wikiPageId, req.user!.id);

    res.json(success(null, 'Wiki page deleted successfully'));
  }
);

/**
 * POST /api/wiki/campaign/:campaignId/bootstrap-legacy
 * Importa paginas canonicas do legado 2023 para a campanha.
 */
export const bootstrapLegacyWiki = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const result = await wikiService.bootstrapLegacyCanon({
      campaignId,
      userId: req.user!.id,
    });

    res.status(201).json(success(result, 'Legacy canon pages imported successfully'));
  }
);
