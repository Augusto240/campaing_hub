import { z } from 'zod';

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  system: z.string().trim().min(1).max(60),
});

export const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    system: z.string().trim().min(1).max(60).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const addCampaignMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['GM', 'PLAYER']),
});

export const removeCampaignMemberParamsSchema = z.object({
  campaignId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const generateEncounterSchema = z.object({
  partyLevel: z.number().int().positive().max(20),
  partySize: z.number().int().positive().max(10),
  environment: z.string().trim().min(1).max(120),
  difficulty: z.enum(['easy', 'medium', 'hard', 'deadly']),
});
