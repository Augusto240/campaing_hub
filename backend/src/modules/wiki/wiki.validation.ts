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

export const wikiRelationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).optional().default(8),
});

export const wikiMentionsQuerySchema = z.object({
  query: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

export const wikiTimelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(5).max(120).optional().default(30),
});

export const createWikiFromTemplateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  templateKey: z.enum([
    'CHARACTER_DOSSIER',
    'LOCATION_ATLAS',
    'SESSION_CHRONICLE',
    'FACTION_DOSSIER',
    'ENCOUNTER_BRIEF',
    'GM_SESSION_PLAN',
  ]),
  parentPageId: z.string().uuid().nullable().optional(),
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
  isPublic: z.boolean().optional().default(true),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
});

const wikiBlockPayloadSchema = z.record(z.string(), z.unknown());

export const upsertWikiBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        blockType: z.enum(['TEXT', 'CHECKLIST', 'QUOTE', 'CALLOUT', 'CODE', 'IMAGE', 'TABLE']),
        payload: wikiBlockPayloadSchema,
      })
    )
    .max(200),
});

export const createWikiPageSchema = z.object({
  campaignId: z.string().uuid(),
  parentPageId: z.string().uuid().nullable().optional(),
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
    parentPageId: z.string().uuid().nullable().optional(),
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

