import { WikiBlockType, WikiCategory } from '@prisma/client';
import { TabletopLightSource, TabletopToken } from '../../config/tabletop-state';

export type CoreCompendiumKind = 'CREATURE' | 'SPELL' | 'ITEM';

export type CoreCompendiumSource = 'SRD' | 'HOMEBREW' | 'LEGACY';

export type CoreCreatePageInput = {
  campaignId: string;
  userId: string;
  parentPageId?: string | null;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
  blocks: Array<{
    blockType: WikiBlockType;
    payload: Record<string, unknown>;
  }>;
};

export type CoreUpsertPageBlocksInput = {
  wikiPageId: string;
  userId: string;
  blocks: Array<{
    blockType: WikiBlockType;
    payload: Record<string, unknown>;
  }>;
};

export type CoreKnowledgeSearchInput = {
  campaignId: string;
  userId: string;
  query: string;
  limit: number;
};

export type CoreBacklinksInput = {
  wikiPageId: string;
  userId: string;
  limit: number;
};

export type CoreListCompendiumInput = {
  campaignId: string;
  userId: string;
  kind?: CoreCompendiumKind;
  search?: string;
  limit: number;
};

export type CoreCreateHomebrewEntryInput = {
  campaignId: string;
  userId: string;
  kind: CoreCompendiumKind;
  name: string;
  summary?: string;
  tags: string[];
  content: Record<string, unknown>;
  source?: CoreCompendiumSource;
  linkedWikiPageIds: string[];
};

export type CoreVttPatchInput = {
  campaignId: string;
  userId: string;
  sessionId?: string | null;
  mapImageUrl?: string | null;
  gridSize?: number;
  tokens?: TabletopToken[];
  fog?: {
    cellSize?: number;
    opacity?: number;
    maskedCells?: string[];
  };
  lights?: TabletopLightSource[];
};

export type CoreCompendiumEntryDTO = {
  id: string;
  systemSlug: string;
  kind: CoreCompendiumKind;
  source: CoreCompendiumSource;
  name: string;
  summary: string;
  tags: string[];
  content: Record<string, unknown>;
  origin: 'STATIC' | 'CAMPAIGN';
};

export type CoreCompendiumView = {
  campaignId: string;
  systemSlug: string;
  creatures: CoreCompendiumEntryDTO[];
  spells: CoreCompendiumEntryDTO[];
  items: CoreCompendiumEntryDTO[];
};
