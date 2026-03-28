import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  campaignIdParamsSchema,
  createWikiFromTemplateSchema,
  createWikiPageSchema,
  listWikiPagesQuerySchema,
  updateWikiPageSchema,
  upsertWikiBlocksSchema,
  wikiMentionsQuerySchema,
  wikiTimelineQuerySchema,
  wikiRelationsQuerySchema,
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
 * GET /api/wiki/campaign/:campaignId/tree
 * Retorna arvore hierarquica da wiki da campanha.
 */
export const getCampaignWikiTree = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const tree = await wikiService.getPageTree({
      campaignId,
      userId: req.user!.id,
    });

    res.json(success(tree, 'Wiki tree retrieved successfully'));
  }
);

/**
 * GET /api/wiki/campaign/:campaignId/timeline
 * Retorna timeline viva da campanha (wiki, sessoes e eventos).
 */
export const getCampaignWikiTimeline = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { limit } = validate(wikiTimelineQuerySchema, req.query);

    const timeline = await wikiService.listCampaignTimeline(campaignId, req.user!.id, limit);

    res.json(success(timeline, 'Wiki timeline retrieved successfully'));
  }
);

/**
 * GET /api/wiki/templates
 * Lista templates de wiki no estilo Notion.
 */
export const getWikiTemplates = asyncHandler(
  async (_req: AuthRequest, res: Response, _next: NextFunction) => {
    const templates = wikiService.getTemplates();

    res.json(success(templates, 'Wiki templates retrieved successfully'));
  }
);

/**
 * POST /api/wiki/campaign/:campaignId/from-template
 * Cria pagina de wiki a partir de um template.
 */
export const createWikiFromTemplate = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { title, templateKey, parentPageId, category, tags, isPublic } = validate(
      createWikiFromTemplateSchema,
      req.body
    );

    const page = await wikiService.createFromTemplate({
      campaignId,
      userId: req.user!.id,
      title,
      templateKey,
      parentPageId,
      category,
      tags: tags ?? [],
      isPublic: isPublic ?? true,
    });

    res.status(201).json(success(page, 'Wiki page created from template successfully'));
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
 * GET /api/wiki/:wikiPageId/relations
 * Retorna backlinks e paginas relacionadas da wiki.
 */
export const getWikiPageRelations = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);
    const { limit } = validate(wikiRelationsQuerySchema, req.query);

    const relations = await wikiService.getPageRelations(wikiPageId, req.user!.id, limit);

    res.json(success(relations, 'Wiki relations retrieved successfully'));
  }
);

/**
 * GET /api/wiki/campaign/:campaignId/mentions
 * Sugestoes de @mentions para links internos.
 */
export const getWikiMentionSuggestions = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { query, limit } = validate(wikiMentionsQuerySchema, req.query);

    const suggestions = await wikiService.searchMentions(campaignId, req.user!.id, query, limit);

    res.json(success(suggestions, 'Wiki mention suggestions retrieved successfully'));
  }
);

/**
 * GET /api/wiki/:wikiPageId/blocks
 * Lista blocos da pagina de wiki.
 */
export const getWikiPageBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    const blocks = await wikiService.getPageBlocks(wikiPageId, req.user!.id);

    res.json(success(blocks, 'Wiki page blocks retrieved successfully'));
  }
);

/**
 * PUT /api/wiki/:wikiPageId/blocks
 * Substitui blocos da pagina (ordem e conteudo).
 */
export const upsertWikiPageBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);
    const { blocks } = validate(upsertWikiBlocksSchema, req.body);

    const updatedBlocks = await wikiService.upsertPageBlocks({
      wikiPageId,
      userId: req.user!.id,
      blocks,
    });

    res.json(success(updatedBlocks, 'Wiki page blocks updated successfully'));
  }
);

/**
 * POST /api/wiki/:wikiPageId/favorite
 * Marca pagina como favorita para o usuario.
 */
export const addWikiFavorite = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    await wikiService.addFavorite(wikiPageId, req.user!.id);

    res.status(201).json(success(null, 'Wiki page favorited successfully'));
  }
);

/**
 * DELETE /api/wiki/:wikiPageId/favorite
 * Remove pagina dos favoritos do usuario.
 */
export const removeWikiFavorite = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    await wikiService.removeFavorite(wikiPageId, req.user!.id);

    res.json(success(null, 'Wiki page unfavorited successfully'));
  }
);

/**
 * GET /api/wiki/campaign/:campaignId/favorites
 * Lista favoritos do usuario na campanha.
 */
export const getCampaignWikiFavorites = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const favorites = await wikiService.listFavorites(campaignId, req.user!.id);

    res.json(success(favorites, 'Wiki favorites retrieved successfully'));
  }
);

/**
 * POST /api/wiki
 * Cria pagina wiki.
 */
export const createWikiPage = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId, parentPageId, title, content, category, tags, isPublic } = validate(
      createWikiPageSchema,
      req.body
    );

    const page = await wikiService.createPage({
      campaignId,
      parentPageId,
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
    const { parentPageId, title, content, category, tags, isPublic } = validate(
      updateWikiPageSchema,
      req.body
    );

    const page = await wikiService.updatePage({
      userId: req.user!.id,
      wikiPageId,
      parentPageId,
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
 * POST /api/wiki/campaign/:campaignId/seed-legacy
 * Importa paginas canonicas do legado 2023.
 */
export const seedLegacyWikiContent = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const result = await wikiService.seedLegacyPages({
      campaignId,
      userId: req.user!.id,
    });

    res.status(201).json(success(result, 'Legacy wiki content imported successfully'));
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

/**
 * POST /api/wiki/campaign/:campaignId/bootstrap-starter-pack
 * Importa pacote inicial de mesa viva (inclui legado + paginas editoriais).
 */
export const bootstrapStarterWikiPack = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const result = await wikiService.bootstrapStarterPack({
      campaignId,
      userId: req.user!.id,
    });

    res.status(201).json(success(result, 'Starter wiki pack imported successfully'));
  }
);
