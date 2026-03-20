import { z } from 'zod';

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const createSessionSchema = z.object({
  campaignId: z.string().uuid(),
  date: z.coerce.date(),
  summary: z.string().trim().max(10000).optional(),
  xpAwarded: z.number().int().min(0).optional().default(0),
});

export const updateSessionSchema = z
  .object({
    date: z.coerce.date().optional(),
    summary: z.string().trim().max(10000).optional(),
    xpAwarded: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });
