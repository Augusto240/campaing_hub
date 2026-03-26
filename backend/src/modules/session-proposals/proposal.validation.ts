import { z } from 'zod';

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const proposalIdParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

export const createSessionProposalSchema = z.object({
  dates: z.array(z.coerce.date()).min(3).max(5),
});

export const voteSessionProposalSchema = z.object({
  date: z.coerce.date(),
  available: z.boolean(),
});

export const decideSessionProposalSchema = z.object({
  decidedDate: z.coerce.date(),
});
