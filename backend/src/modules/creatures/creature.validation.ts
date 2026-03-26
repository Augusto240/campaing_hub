import { z } from 'zod';

export const creatureIdParamsSchema = z.object({
  creatureId: z.string().uuid(),
});

export const listCreaturesQuerySchema = z.object({
  systemId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  creatureType: z.string().trim().max(80).optional(),
  includePrivate: z.coerce.boolean().optional(),
});

export const createCreatureSchema = z.object({
  name: z.string().trim().min(1).max(120),
  systemId: z.string().uuid(),
  creatureType: z.string().trim().min(1).max(80),
  stats: z.record(z.unknown()),
  abilities: z.record(z.unknown()),
  loot: z.record(z.unknown()).optional(),
  xpReward: z.number().int().nonnegative().optional(),
  description: z.string().trim().max(2000).optional(),
  isPublic: z.boolean().optional(),
});

export const updateCreatureSchema = createCreatureSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field must be provided' }
);
