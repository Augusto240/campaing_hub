import { z } from 'zod';

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const lootIdParamsSchema = z.object({
  lootId: z.string().uuid(),
});

export const createLootSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  value: z.number().min(0).optional().default(0),
});

export const updateLootSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    value: z.number().min(0).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const assignLootSchema = z.object({
  characterId: z.string().uuid().nullable(),
});
