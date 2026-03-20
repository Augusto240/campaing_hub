import { z } from 'zod';

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const wikiPageIdParamsSchema = z.object({
  wikiPageId: z.string().uuid(),
});

export const listWikiPagesQuerySchema = z.object({
  category: z
    .enum([
      'NPC',
      'LOCATION',
      'FACTION',
      'LORE',
      'HOUSE_RULE',
      'BESTIARY',
      'DEITY',
      'MYTHOS',
      'SESSION_RECAP',
    ])
    .optional(),
  search: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export const createWikiPageSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(100000),
  category: z.enum([
    'NPC',
    'LOCATION',
    'FACTION',
    'LORE',
    'HOUSE_RULE',
    'BESTIARY',
    'DEITY',
    'MYTHOS',
    'SESSION_RECAP',
  ]),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
  isPublic: z.boolean().optional().default(true),
});

export const updateWikiPageSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(100000).optional(),
    category: z
      .enum([
        'NPC',
        'LOCATION',
        'FACTION',
        'LORE',
        'HOUSE_RULE',
        'BESTIARY',
        'DEITY',
        'MYTHOS',
        'SESSION_RECAP',
      ])
      .optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

