import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import { campaignGraphParamsSchema, campaignGraphQuerySchema } from './knowledge-graph.validation';
import { KnowledgeGraphService } from './knowledge-graph.service';

const knowledgeGraphService = new KnowledgeGraphService();

export const getCampaignKnowledgeGraph = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignGraphParamsSchema, req.params);
    const { limit } = validate(campaignGraphQuerySchema, req.query);

    const graph = await knowledgeGraphService.buildCampaignGraph(campaignId, req.user!.id, limit);

    res.json(success(graph, 'Campaign knowledge graph retrieved successfully'));
  }
);
