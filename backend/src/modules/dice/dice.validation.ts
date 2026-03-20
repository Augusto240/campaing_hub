import { z } from 'zod';

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const createDiceRollSchema = z.object({
  campaignId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  characterId: z.string().uuid().optional(),
  formula: z.string().trim().min(1).max(60),
  label: z.string().trim().max(120).optional(),
  isPrivate: z.boolean().optional().default(false),
});

export const listDiceRollsQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

