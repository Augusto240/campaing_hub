export type WorkshopBlockType = 'paragraph' | 'heading' | 'quote' | 'callout' | 'checklist' | 'code';

export type WorkshopEntityType = 'character' | 'place' | 'faction' | 'concept' | 'session';

export type WorkshopRelationOrigin = 'seed' | 'live';

export interface WorkshopBlock {
  id: string;
  type: WorkshopBlockType;
  content: string;
  checked?: boolean;
}

export interface WorkshopPage {
  id: string;
  title: string;
  parentId: string | null;
  summary: string;
  tags: string[];
  updatedAt: string;
  blocks: WorkshopBlock[];
}

export interface WorkshopEntity {
  id: string;
  name: string;
  type: WorkshopEntityType;
  summary: string;
  pageId: string | null;
}

export interface WorkshopRelation {
  id: string;
  sourcePageId: string;
  targetEntityId: string;
  targetPageId: string | null;
  label: string;
  createdAt: string;
  origin: WorkshopRelationOrigin;
}

export interface WorkshopTimelineEntry {
  id: string;
  pageId: string;
  title: string;
  description: string;
  happenedAt: string;
  kind: 'seed' | 'relation';
  relationId?: string;
}

export interface WorkshopSeed {
  pages: WorkshopPage[];
  entities: WorkshopEntity[];
  relations: WorkshopRelation[];
  timeline: WorkshopTimelineEntry[];
}

export interface WorkshopTreeNode extends WorkshopPage {
  depth: number;
  children: WorkshopTreeNode[];
}

export interface WorkshopRelationView extends WorkshopRelation {
  sourcePage: WorkshopPage | null;
  targetPage: WorkshopPage | null;
  entity: WorkshopEntity | null;
}

export interface WorkshopGraphNode {
  id: string;
  label: string;
  type: 'page' | WorkshopEntityType;
}

export interface WorkshopGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface WorkshopGraphViewModel {
  nodes: WorkshopGraphNode[];
  edges: WorkshopGraphEdge[];
  highlightEdgeId: string | null;
}

export const WORKSHOP_BLOCK_LABELS: Record<WorkshopBlockType, string> = {
  paragraph: 'Texto',
  heading: 'Titulo',
  quote: 'Citacao',
  callout: 'Nota',
  checklist: 'Checklist',
  code: 'Codigo',
};
