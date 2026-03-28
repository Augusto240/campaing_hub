import { z } from 'zod';

export const coreCampaignParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const coreWikiPageParamsSchema = z.object({
  wikiPageId: z.string().uuid(),
});

export const coreCreatePageSchema = z.object({
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
  blocks: z
    .array(
      z.object({
        blockType: z.enum(['TEXT', 'CHECKLIST', 'QUOTE', 'CALLOUT', 'CODE', 'IMAGE', 'TABLE']),
        payload: z.record(z.string(), z.unknown()),
      })
    )
    .max(200)
    .optional()
    .default([]),
});

export const coreUpsertBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        blockType: z.enum(['TEXT', 'CHECKLIST', 'QUOTE', 'CALLOUT', 'CODE', 'IMAGE', 'TABLE']),
        payload: z.record(z.string(), z.unknown()),
      })
    )
    .max(200),
});

export const coreSearchQuerySchema = z.object({
  query: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(200).optional().default(40),
});

export const coreBacklinksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export const coreCompendiumQuerySchema = z.object({
  kind: z.enum(['CREATURE', 'SPELL', 'ITEM']).optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(80),
});

export const coreCreateHomebrewSchema = z.object({
  kind: z.enum(['CREATURE', 'SPELL', 'ITEM']),
  name: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(400).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional().default([]),
  content: z.record(z.string(), z.unknown()).optional().default({}),
  source: z.enum(['HOMEBREW', 'LEGACY']).optional().default('HOMEBREW'),
  linkedWikiPageIds: z.array(z.string().uuid()).max(20).optional().default([]),
});

const tabletopTokenSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(60),
  x: z.number().finite(),
  y: z.number().finite(),
  color: z.string().trim().min(1).max(20),
  size: z.number().int().min(24).max(160),
});

const tabletopLightSchema = z.object({
  id: z.string().trim().min(1).max(64),
  x: z.number().finite(),
  y: z.number().finite(),
  radius: z.number().finite(),
  intensity: z.number().finite(),
  color: z.string().trim().min(1).max(20),
});

export const coreUpsertVttStateSchema = z
  .object({
    sessionId: z.string().uuid().nullable().optional(),
    mapImageUrl: z.string().trim().max(500).nullable().optional(),
    gridSize: z.number().int().min(24).max(120).optional(),
    tokens: z.array(tabletopTokenSchema).max(150).optional(),
    fog: z
      .object({
        cellSize: z.number().int().min(24).max(120).optional(),
        opacity: z.number().min(0.15).max(0.95).optional(),
        maskedCells: z.array(z.string().regex(/^\d{1,4}:\d{1,4}$/)).max(6000).optional(),
      })
      .optional(),
    lights: z.array(tabletopLightSchema).max(24).optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one VTT field must be provided',
  });

export const coreSnapshotQuerySchema = z.object({
  limit: z.coerce.number().int().min(20).max(500).optional().default(160),
});
