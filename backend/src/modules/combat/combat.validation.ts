import { z } from 'zod';

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const encounterIdParamsSchema = z.object({
  encounterId: z.string().uuid(),
});

export const combatantIdParamsSchema = z.object({
  encounterId: z.string().uuid(),
  combatantId: z.string().uuid(),
});

const combatantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  initiative: z.number().int(),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  isNpc: z.boolean().optional(),
  characterId: z.string().uuid().optional(),
  conditions: z.array(z.string().trim().min(1).max(80)).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const createEncounterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  combatants: z.array(combatantSchema).min(1).max(24),
});

export const addCombatantSchema = combatantSchema;

export const updateCombatantSchema = combatantSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field must be provided' }
);

export const reorderCombatantsSchema = z.object({
  combatantIds: z.array(z.string().uuid()).min(1),
});
