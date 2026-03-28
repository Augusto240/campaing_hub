import { z } from 'zod';

export const campaignGraphParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const campaignGraphQuerySchema = z.object({
  limit: z.coerce.number().int().min(20).max(500).optional().default(140),
});
