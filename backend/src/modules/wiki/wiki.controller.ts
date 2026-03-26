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
import { WikiBlocksService } from './wiki-blocks.service';
import { WikiBacklinksService } from './wiki-backlinks.service';

const wikiService = new WikiService();
const blocksService = new WikiBlocksService();
const backlinksService = new WikiBacklinksService();

/**
 * GET /api/wiki/campaign/:campaignId
 * Lista paginas wiki da campanha com filtros.
 */
export const getCampaignWikiPages = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { category, search, tag, limit, parentId } = validate(listWikiPagesQuerySchema, req.query);

    const pages = await wikiService.listPages({
      campaignId,
      userId: req.user!.id,
      category,
      search,
      tag,
      limit: limit ?? 100,
      parentId: parentId === 'null' ? null : parentId,
    });

    res.json(success(pages, 'Wiki pages retrieved successfully'));
  }
);

/**
 * GET /api/wiki/campaign/:campaignId/tree
 * Retorna árvore hierárquica de pages.
 */
export const getWikiPageTree = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const tree = await wikiService.getPageTree(campaignId, req.user!.id);

    res.json(success(tree, 'Wiki tree retrieved successfully'));
  }
);

/**
 * GET /api/wiki/campaign/:campaignId/favorites
 * Retorna páginas favoritas.
 */
export const getWikiFavorites = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const favorites = await wikiService.getFavorites(campaignId, req.user!.id);

    res.json(success(favorites, 'Favorites retrieved successfully'));
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
    const { campaignId, title, content, category, tags, isPublic, parentId, icon, coverImage } = validate(
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
      parentId,
      icon,
      coverImage,
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
    const { title, content, category, tags, isPublic, parentId, icon, coverImage, position, isFavorite } = validate(updateWikiPageSchema, req.body);

    const page = await wikiService.updatePage({
      userId: req.user!.id,
      wikiPageId,
      title,
      content,
      category,
      tags,
      isPublic,
      parentId,
      icon,
      coverImage,
      position,
      isFavorite,
    });

    res.json(success(page, 'Wiki page updated successfully'));
  }
);

/**
 * POST /api/wiki/:wikiPageId/move
 * Move página na hierarquia.
 */
export const moveWikiPage = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);
    const { parentId, position } = req.body;

    const page = await wikiService.movePage(
      wikiPageId,
      req.user!.id,
      parentId ?? null,
      position ?? 0
    );

    res.json(success(page, 'Wiki page moved successfully'));
  }
);

/**
 * POST /api/wiki/:wikiPageId/favorite
 * Toggle favorito.
 */
export const toggleWikiFavorite = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    const page = await wikiService.toggleFavorite(wikiPageId, req.user!.id);

    res.json(success(page, 'Favorite toggled successfully'));
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

// ==== BLOCKS ====

/**
 * GET /api/wiki/:wikiPageId/blocks
 * Lista blocos de uma página.
 */
export const getWikiBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    const blocks = await blocksService.getBlocksByPage(wikiPageId);

    res.json(success(blocks, 'Blocks retrieved successfully'));
  }
);

/**
 * POST /api/wiki/:wikiPageId/blocks
 * Cria bloco.
 */
export const createWikiBlock = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);
    const { type, content, position, indent, isChecked } = req.body;

    const block = await blocksService.createBlock({
      pageId: wikiPageId,
      type,
      content,
      position,
      indent,
      isChecked,
    });

    res.status(201).json(success(block, 'Block created successfully'));
  }
);

/**
 * PUT /api/wiki/blocks/:blockId
 * Atualiza bloco.
 */
export const updateWikiBlock = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { blockId } = req.params;
    const { type, content, position, indent, isChecked } = req.body;

    const block = await blocksService.updateBlock({
      blockId,
      type,
      content,
      position,
      indent,
      isChecked,
    });

    res.json(success(block, 'Block updated successfully'));
  }
);

/**
 * DELETE /api/wiki/blocks/:blockId
 * Remove bloco.
 */
export const deleteWikiBlock = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { blockId } = req.params;

    await blocksService.deleteBlock(blockId);

    res.json(success(null, 'Block deleted successfully'));
  }
);

/**
 * POST /api/wiki/:wikiPageId/blocks/reorder
 * Reordena blocos.
 */
export const reorderWikiBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);
    const { blockIds } = req.body;

    await blocksService.reorderBlocks({ pageId: wikiPageId, blockIds });

    res.json(success(null, 'Blocks reordered successfully'));
  }
);

/**
 * POST /api/wiki/blocks/:blockId/duplicate
 * Duplica bloco.
 */
export const duplicateWikiBlock = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { blockId } = req.params;

    const block = await blocksService.duplicateBlock(blockId);

    res.status(201).json(success(block, 'Block duplicated successfully'));
  }
);

// ==== BACKLINKS ====

/**
 * GET /api/wiki/:wikiPageId/backlinks
 * Lista backlinks de uma página.
 */
export const getWikiBacklinks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    const backlinks = await backlinksService.getBacklinksForPage(wikiPageId);

    res.json(success(backlinks, 'Backlinks retrieved successfully'));
  }
);

/**
 * GET /api/wiki/:wikiPageId/outgoing
 * Lista links de saída de uma página.
 */
export const getWikiOutgoingLinks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { wikiPageId } = validate(wikiPageIdParamsSchema, req.params);

    const links = await backlinksService.getOutgoingLinks(wikiPageId);

    res.json(success(links, 'Outgoing links retrieved successfully'));
  }
);
