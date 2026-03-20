import { z } from 'zod';

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const characterIdParamsSchema = z.object({
  characterId: z.string().uuid(),
});

export const createCharacterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  class: z.string().trim().min(1).max(120),
  campaignId: z.string().uuid(),
});

export const updateCharacterSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    class: z.string().trim().min(1).max(120).optional(),
    level: z.number().int().min(1).max(20).optional(),
    xp: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });
