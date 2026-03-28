import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  attachCharacterNodeSchema,
  createNodeSchema,
  createWikiNodeSchema,
  linkNodesSchema,
  nodeByIdParamsSchema,
  nodeCampaignParamsSchema,
  nodeCharacterParamsSchema,
  nodeListQuerySchema,
  replaceNodeBlocksSchema,
} from './node.validation';
import { NodeService } from './node.service';

const nodeService = new NodeService();

export const getCampaignNodes = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(nodeCampaignParamsSchema, req.params);
    const { type, limit } = validate(nodeListQuerySchema, req.query);

    const data = await nodeService.listCampaignNodes({
      campaignId,
      userId: req.user!.id,
      type,
      limit: limit ?? 80,
    });

    res.json(success(data, 'Campaign nodes retrieved successfully'));
  }
);

export const createCampaignNode = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(nodeCampaignParamsSchema, req.params);
    const payload = validate(createNodeSchema, req.body);

    const created = await nodeService.createNode({
      campaignId,
      userId: req.user!.id,
      type: payload.type,
      title: payload.title,
      content: payload.content,
      sourceId: payload.sourceId,
      pageId: payload.pageId,
      legacyAnchor: payload.legacyAnchor ?? false,
      metadata: payload.metadata ?? {},
    });

    res.status(201).json(success(created, 'Node created successfully'));
  }
);

export const createCampaignWikiNode = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(nodeCampaignParamsSchema, req.params);
    const payload = validate(createWikiNodeSchema, req.body);

    const created = await nodeService.createWikiNode({
      campaignId,
      userId: req.user!.id,
      parentWikiPageId: payload.parentWikiPageId,
      parentNodeId: payload.parentNodeId,
      title: payload.title,
      content: payload.content,
      category: payload.category,
      tags: payload.tags ?? [],
      isPublic: payload.isPublic ?? true,
      blocks: payload.blocks ?? [],
    });

    res.status(201).json(success(created, 'Wiki node created successfully'));
  }
);

export const createNodeRelation = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(nodeCampaignParamsSchema, req.params);
    const payload = validate(linkNodesSchema, req.body);

    const relation = await nodeService.linkNodes({
      campaignId,
      userId: req.user!.id,
      fromId: payload.fromId,
      toId: payload.toId,
      type: payload.type,
      metadata: payload.metadata ?? {},
    });

    res.status(201).json(success(relation, 'Node relation upserted successfully'));
  }
);

export const attachCharacterToNode = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId, characterId } = validate(nodeCharacterParamsSchema, req.params);
    const payload = validate(attachCharacterNodeSchema, req.body);

    const result = await nodeService.attachCharacterToNode({
      campaignId,
      userId: req.user!.id,
      characterId,
      targetNodeId: payload.targetNodeId,
      relationType: payload.relationType ?? 'APPEARS_IN',
      metadata: payload.metadata ?? {},
    });

    res.status(201).json(success(result, 'Character attached to node successfully'));
  }
);

export const getNodeBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId, nodeId } = validate(nodeByIdParamsSchema, req.params);

    const blocks = await nodeService.getNodeBlocks({
      campaignId,
      userId: req.user!.id,
      nodeId,
    });

    res.json(success(blocks, 'Node blocks retrieved successfully'));
  }
);

export const replaceNodeBlocks = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId, nodeId } = validate(nodeByIdParamsSchema, req.params);
    const { blocks } = validate(replaceNodeBlocksSchema, req.body);

    const updated = await nodeService.replaceNodeBlocks({
      campaignId,
      userId: req.user!.id,
      nodeId,
      blocks,
    });

    res.json(success(updated, 'Node blocks replaced successfully'));
  }
);
