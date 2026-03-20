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
  attributes: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  resources: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  inventory: z.array(z.record(z.union([z.number(), z.string(), z.boolean(), z.null()]))).optional(),
  notes: z.string().trim().max(5000).optional(),
  imageUrl: z.string().url().max(1024).optional(),
});

export const updateCharacterSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    class: z.string().trim().min(1).max(120).optional(),
    level: z.number().int().min(1).max(20).optional(),
    xp: z.number().int().min(0).optional(),
    attributes: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
    resources: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
    inventory: z.array(z.record(z.union([z.number(), z.string(), z.boolean(), z.null()]))).optional(),
    notes: z.string().trim().max(5000).optional(),
    imageUrl: z.string().url().max(1024).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const updateResourcesSchema = z.object({
  resources: z.record(z.union([z.number(), z.string(), z.boolean()])),
});

export const sanityCheckSchema = z.object({
  roll: z.number().int().min(1).max(100),
  difficulty: z.number().int().min(1).max(100),
  trigger: z.string().trim().min(1).max(255),
  sessionId: z.string().uuid().optional(),
  successLoss: z.number().int().min(0).max(20).optional().default(0),
  failedLoss: z.number().int().min(1).max(20).optional().default(1),
});

export const spellCastSchema = z.object({
  spellName: z.string().trim().min(1).max(255),
  manaCost: z.number().int().min(0),
  faithCost: z.number().int().min(0).optional().default(0),
  result: z.string().trim().max(2000).optional(),
  sessionId: z.string().uuid().optional(),
});
