import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { validate } from '../../utils/validation';
import {
  campaignIdParamsSchema,
  createSessionProposalSchema,
  decideSessionProposalSchema,
  proposalIdParamsSchema,
  voteSessionProposalSchema,
} from './proposal.validation';
import { SessionProposalService } from './proposal.service';

const proposalService = new SessionProposalService();

/**
 * POST /api/campaigns/:campaignId/session-proposals
 * Cria proposta de datas para votacao.
 */
export const createSessionProposal = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { dates } = validate(createSessionProposalSchema, req.body);
    const proposal = await proposalService.createProposal(campaignId, req.user!.id, dates);

    res.status(201).json(success(proposal, 'Session proposal created successfully'));
  }
);

/**
 * GET /api/campaigns/:campaignId/session-proposals
 * Lista propostas de sessao da campanha.
 */
export const listCampaignProposals = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const proposals = await proposalService.listCampaignProposals(campaignId);

    res.json(success(proposals, 'Session proposals retrieved successfully'));
  }
);

/**
 * POST /api/session-proposals/:proposalId/votes
 * Registra voto de disponibilidade do usuario.
 */
export const voteSessionProposal = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { proposalId } = validate(proposalIdParamsSchema, req.params);
    const { date, available } = validate(voteSessionProposalSchema, req.body);
    const vote = await proposalService.voteProposal(proposalId, req.user!.id, date, available);

    res.status(201).json(success(vote, 'Session proposal vote registered successfully'));
  }
);

/**
 * PATCH /api/session-proposals/:proposalId/decide
 * Define a data final da sessao apos a votacao.
 */
export const decideSessionProposal = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { proposalId } = validate(proposalIdParamsSchema, req.params);
    const { decidedDate } = validate(decideSessionProposalSchema, req.body);
    const proposal = await proposalService.decideProposal(proposalId, decidedDate);

    res.json(success(proposal, 'Session proposal decided successfully'));
  }
);
