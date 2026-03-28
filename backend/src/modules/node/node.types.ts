import { WikiBlockType, WikiCategory } from '@prisma/client';

export type NodeCreateInput = {
  campaignId: string;
  userId: string;
  type: string;
  title: string;
  content?: Record<string, unknown> | null;
  sourceId?: string;
  pageId?: string | null;
  legacyAnchor?: boolean;
  metadata?: Record<string, unknown>;
};

export type NodeListInput = {
  campaignId: string;
  userId: string;
  type?: string;
  limit?: number;
};

export type NodeLinkInput = {
  campaignId: string;
  userId: string;
  fromId: string;
  toId: string;
  type: string;
  metadata?: Record<string, unknown>;
};

export type NodeWikiBlockInput = {
  blockType: WikiBlockType;
  payload: Record<string, unknown>;
};

export type NodeCreateWikiPageInput = {
  campaignId: string;
  userId: string;
  parentWikiPageId?: string | null;
  parentNodeId?: string | null;
  title: string;
  content: string;
  category: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
  blocks?: NodeWikiBlockInput[];
};

export type NodeAttachCharacterInput = {
  campaignId: string;
  userId: string;
  characterId: string;
  targetNodeId: string;
  relationType?: string;
  metadata?: Record<string, unknown>;
};

export type NodeBlocksInput = {
  campaignId: string;
  userId: string;
  nodeId: string;
};

export type NodeReplaceBlocksInput = NodeBlocksInput & {
  blocks: NodeWikiBlockInput[];
};
