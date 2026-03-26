import { z } from 'zod';

const wikiCategoryEnum = z.enum([
  'NPC',
  'LOCATION',
  'FACTION',
  'LORE',
  'HOUSE_RULE',
  'BESTIARY',
  'DEITY',
  'MYTHOS',
  'SESSION_RECAP',
  'CHARACTER',
  'EVENT',
  'ITEM',
  'QUEST',
  'TIMELINE',
]);

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const wikiPageIdParamsSchema = z.object({
  wikiPageId: z.string().uuid(),
});

export const listWikiPagesQuerySchema = z.object({
  category: wikiCategoryEnum.optional(),
  search: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
  parentId: z.string().optional(),
});

export const createWikiPageSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(100000).default(''),
  category: wikiCategoryEnum,
  tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  parentId: z.string().uuid().optional(),
  icon: z.string().max(10).optional(),
  coverImage: z.string().url().max(500).optional(),
});

export const updateWikiPageSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().max(100000).optional(),
    category: wikiCategoryEnum.optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    isPublic: z.boolean().optional(),
    parentId: z.string().uuid().nullish(),
    icon: z.string().max(10).nullish(),
    coverImage: z.string().url().max(500).nullish(),
    position: z.number().int().min(0).optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const movePageSchema = z.object({
  parentId: z.string().uuid().nullish(),
  position: z.number().int().min(0).default(0),
});

export const createBlockSchema = z.object({
  type: z.enum([
    'TEXT',
    'HEADING_1',
    'HEADING_2',
    'HEADING_3',
    'BULLETED_LIST',
    'NUMBERED_LIST',
    'TODO',
    'TOGGLE',
    'QUOTE',
    'CALLOUT',
    'CODE',
    'DIVIDER',
    'IMAGE',
    'LINK_TO_PAGE',
    'EMBED',
  ]),
  content: z.record(z.unknown()),
  position: z.number().int().min(0).optional(),
  indent: z.number().int().min(0).max(10).optional(),
  isChecked: z.boolean().optional(),
});

export const updateBlockSchema = z.object({
  type: z.enum([
    'TEXT',
    'HEADING_1',
    'HEADING_2',
    'HEADING_3',
    'BULLETED_LIST',
    'NUMBERED_LIST',
    'TODO',
    'TOGGLE',
    'QUOTE',
    'CALLOUT',
    'CODE',
    'DIVIDER',
    'IMAGE',
    'LINK_TO_PAGE',
    'EMBED',
  ]).optional(),
  content: z.record(z.unknown()).optional(),
  position: z.number().int().min(0).optional(),
  indent: z.number().int().min(0).max(10).optional(),
  isChecked: z.boolean().optional(),
});

export const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string().uuid()),
});
