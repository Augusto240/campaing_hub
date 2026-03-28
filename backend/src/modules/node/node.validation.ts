import { z } from 'zod';

const nodeTypeSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[A-Z0-9_]+$/, 'type must use SCREAMING_SNAKE_CASE');

const nodeRelationTypeSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[A-Z0-9_]+$/, 'relation type must use SCREAMING_SNAKE_CASE');

const wikiCategorySchema = z.enum([
  'NPC',
  'LOCATION',
  'FACTION',
  'LORE',
  'HOUSE_RULE',
  'BESTIARY',
  'DEITY',
  'MYTHOS',
  'SESSION_RECAP',
]);

const wikiBlockTypeSchema = z.enum(['TEXT', 'CHECKLIST', 'QUOTE', 'CALLOUT', 'CODE', 'IMAGE', 'TABLE']);

export const nodeCampaignParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const nodeByIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
  nodeId: z.string().uuid(),
});

export const nodeCharacterParamsSchema = z.object({
  campaignId: z.string().uuid(),
  characterId: z.string().uuid(),
});

export const nodeListQuerySchema = z.object({
  type: nodeTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(250).optional().default(80),
});

export const createNodeSchema = z.object({
  type: nodeTypeSchema,
  title: z.string().trim().min(1).max(200),
  content: z.record(z.string(), z.unknown()).nullable().optional().default(null),
  sourceId: z.string().trim().min(1).max(120).optional(),
  pageId: z.string().uuid().nullable().optional(),
  legacyAnchor: z.boolean().optional().default(false),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const createWikiNodeSchema = z.object({
  parentWikiPageId: z.string().uuid().nullable().optional(),
  parentNodeId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(100000),
  category: wikiCategorySchema,
  tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  blocks: z
    .array(
      z.object({
        blockType: wikiBlockTypeSchema,
        payload: z.record(z.string(), z.unknown()),
      })
    )
    .max(200)
    .optional()
    .default([]),
});

export const linkNodesSchema = z.object({
  fromId: z.string().uuid(),
  toId: z.string().uuid(),
  type: nodeRelationTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const attachCharacterNodeSchema = z.object({
  targetNodeId: z.string().uuid(),
  relationType: nodeRelationTypeSchema.optional().default('CHARACTER_IN_NODE'),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const replaceNodeBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        blockType: wikiBlockTypeSchema,
        payload: z.record(z.string(), z.unknown()),
      })
    )
    .max(300),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});
