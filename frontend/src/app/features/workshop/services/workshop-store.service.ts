import { Injectable, computed, signal } from '@angular/core';
import { MockDataService } from './mock-data.service';
import {
  WorkshopBlock,
  WorkshopBlockType,
  WorkshopEntity,
  WorkshopGraphViewModel,
  WorkshopPage,
  WorkshopRelation,
  WorkshopRelationView,
  WorkshopSeed,
  WorkshopTimelineEntry,
  WorkshopTreeNode,
} from '../workshop.types';

export const normalizeEntityName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const extractEntityMentions = (content: string): string[] => {
  const mentions = new Map<string, string>();
  const mentionPattern = /@([A-Z0-9][A-Za-z0-9.'-]*(?:\s+[A-Z0-9][A-Za-z0-9.'-]*){0,5})/g;

  for (const match of content.matchAll(mentionPattern)) {
    const name = match[1]?.trim().replace(/[.,;:!?)]$/, '');
    if (!name) {
      continue;
    }

    mentions.set(normalizeEntityName(name), name);
  }

  return [...mentions.values()];
};

export const buildPageTree = (pages: WorkshopPage[]): WorkshopTreeNode[] => {
  const nodeById = new Map<string, WorkshopTreeNode>();

  for (const page of pages) {
    nodeById.set(page.id, {
      ...page,
      depth: 0,
      children: [],
    });
  }

  const roots: WorkshopTreeNode[] = [];

  for (const node of nodeById.values()) {
    if (node.parentId && nodeById.has(node.parentId)) {
      const parent = nodeById.get(node.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: WorkshopTreeNode[]): WorkshopTreeNode[] =>
    nodes
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));

  return sortNodes(roots);
};

export const flattenTree = (nodes: WorkshopTreeNode[]): WorkshopTreeNode[] =>
  nodes.flatMap((node) => [node, ...flattenTree(node.children.map((child) => ({ ...child, depth: node.depth + 1 })))]);

export const createGraphViewModel = (
  pages: WorkshopPage[],
  entities: WorkshopEntity[],
  relations: WorkshopRelation[],
  highlightEdgeId: string | null
): WorkshopGraphViewModel => {
  const pageNodes = pages.map((page) => ({
    id: `page:${page.id}`,
    label: page.title,
    type: 'page' as const,
  }));

  const entityNodes = entities
    .filter((entity) => !entity.pageId)
    .map((entity) => ({
      id: `entity:${entity.id}`,
      label: entity.name,
      type: entity.type,
    }));

  const nodeIds = new Set([...pageNodes, ...entityNodes].map((node) => node.id));
  const edges = relations
    .map((relation) => ({
      id: relation.id,
      source: `page:${relation.sourcePageId}`,
      target: relation.targetPageId ? `page:${relation.targetPageId}` : `entity:${relation.targetEntityId}`,
      label: relation.label,
    }))
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return {
    nodes: [...pageNodes, ...entityNodes],
    edges,
    highlightEdgeId,
  };
};

@Injectable({ providedIn: 'root' })
export class WorkshopStoreService {
  private readonly seed = signal<WorkshopSeed | null>(null);
  private readonly blocksByPage = signal<Record<string, WorkshopBlock[]>>({});
  private readonly liveRelations = signal<WorkshopRelation[]>([]);
  private readonly lastLiveRelationId = signal<string | null>(null);
  private relationSequence = 0;
  private blockSequence = 0;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedPageId = signal<string | null>(null);

  readonly pages = computed(() => this.seed()?.pages ?? []);
  readonly entities = computed(() => this.seed()?.entities ?? []);
  readonly seedRelations = computed(() => this.seed()?.relations ?? []);
  readonly allRelations = computed(() => [...this.seedRelations(), ...this.liveRelations()]);

  readonly pageTree = computed(() => buildPageTree(this.pages()));
  readonly flatTree = computed(() => flattenTree(this.pageTree()));

  readonly selectedPage = computed(() => {
    const selectedId = this.selectedPageId();
    return this.pages().find((page) => page.id === selectedId) ?? this.pages()[0] ?? null;
  });

  readonly selectedBlocks = computed(() => {
    const page = this.selectedPage();
    if (!page) {
      return [];
    }

    return this.blocksByPage()[page.id] ?? page.blocks;
  });

  readonly selectedOutgoingRelations = computed(() =>
    this.toRelationViews(this.allRelations().filter((relation) => relation.sourcePageId === this.selectedPage()?.id))
  );

  readonly selectedBacklinks = computed(() => {
    const pageId = this.selectedPage()?.id;
    if (!pageId) {
      return [];
    }

    return this.toRelationViews(
      this.allRelations().filter((relation) => relation.targetPageId === pageId && relation.sourcePageId !== pageId)
    );
  });

  readonly timeline = computed(() => {
    const baseTimeline = this.seed()?.timeline ?? [];
    const liveEntries: WorkshopTimelineEntry[] = this.liveRelations().map((relation) => {
      const source = this.pageById(relation.sourcePageId);
      const entity = this.entityById(relation.targetEntityId);

      return {
        id: `time-${relation.id}`,
        pageId: relation.sourcePageId,
        title: `Relacao criada: ${entity?.name ?? 'Entidade'}`,
        description: `${source?.title ?? 'Pagina'} agora referencia ${entity?.name ?? 'uma entidade'}.`,
        happenedAt: relation.createdAt,
        kind: 'relation',
        relationId: relation.id,
      };
    });

    return [...baseTimeline, ...liveEntries].sort(
      (a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime()
    );
  });

  readonly graphView = computed(() =>
    createGraphViewModel(this.pages(), this.entities(), this.allRelations(), this.lastLiveRelationId())
  );

  constructor(private readonly mockDataService: MockDataService) {}

  async load(): Promise<void> {
    if (this.seed()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const seed = await this.mockDataService.loadSeed();
      this.seed.set(seed);
      this.blocksByPage.set(
        Object.fromEntries(seed.pages.map((page) => [page.id, page.blocks.map((block) => ({ ...block }))]))
      );
      this.selectedPageId.set(seed.pages.find((page) => page.id === 'session-01')?.id ?? seed.pages[0]?.id ?? null);
    } catch {
      this.error.set('Nao foi possivel carregar a seed local do workshop.');
    } finally {
      this.loading.set(false);
    }
  }

  selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
  }

  updateBlockContent(blockId: string, content: string): void {
    this.updateSelectedBlocks((blocks) =>
      blocks.map((block) => (block.id === blockId ? { ...block, content } : block))
    );

    const pageId = this.selectedPage()?.id;
    if (pageId) {
      this.syncRelationsForPage(pageId);
    }
  }

  setBlockType(blockId: string, type: WorkshopBlockType): void {
    this.updateSelectedBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              type,
              content: block.content.trim() === '/' ? '' : block.content,
            }
          : block
      )
    );
  }

  toggleChecklist(blockId: string): void {
    this.updateSelectedBlocks((blocks) =>
      blocks.map((block) => (block.id === blockId ? { ...block, checked: !block.checked } : block))
    );
  }

  insertBlockAfter(blockId: string | null, type: WorkshopBlockType = 'paragraph'): void {
    const pageId = this.selectedPage()?.id;
    if (!pageId) {
      return;
    }

    const currentBlocks = this.blocksByPage()[pageId] ?? [];
    const nextBlock: WorkshopBlock = {
      id: `${pageId}-live-block-${++this.blockSequence}`,
      type,
      content: '',
      ...(type === 'checklist' ? { checked: false } : {}),
    };

    const index = blockId ? currentBlocks.findIndex((block) => block.id === blockId) : currentBlocks.length - 1;
    const insertionIndex = index >= 0 ? index + 1 : currentBlocks.length;

    this.blocksByPage.update((state) => ({
      ...state,
      [pageId]: [
        ...currentBlocks.slice(0, insertionIndex),
        nextBlock,
        ...currentBlocks.slice(insertionIndex),
      ],
    }));
  }

  private updateSelectedBlocks(update: (blocks: WorkshopBlock[]) => WorkshopBlock[]): void {
    const page = this.selectedPage();
    if (!page) {
      return;
    }

    const currentBlocks = this.blocksByPage()[page.id] ?? page.blocks;
    this.blocksByPage.update((state) => ({
      ...state,
      [page.id]: update(currentBlocks),
    }));
  }

  private syncRelationsForPage(pageId: string): void {
    const blocks = this.blocksByPage()[pageId] ?? [];
    const content = blocks.map((block) => block.content).join('\n');
    const normalizedContent = normalizeEntityName(content);
    const mentionedEntityIds = new Set(
      this.entities()
        .filter((entity) => normalizedContent.includes(`@${normalizeEntityName(entity.name)}`))
        .map((entity) => entity.id)
    );

    const retainedRelations = this.liveRelations().filter(
      (relation) => relation.sourcePageId !== pageId || mentionedEntityIds.has(relation.targetEntityId)
    );

    const existingTargets = new Set(
      [...this.seedRelations(), ...retainedRelations]
        .filter((relation) => relation.sourcePageId === pageId)
        .map((relation) => relation.targetEntityId)
    );

    const additions: WorkshopRelation[] = [];
    for (const entityId of mentionedEntityIds) {
      if (existingTargets.has(entityId)) {
        continue;
      }

      const entity = this.entityById(entityId);
      const relation: WorkshopRelation = {
        id: `rel-live-${++this.relationSequence}`,
        sourcePageId: pageId,
        targetEntityId: entityId,
        targetPageId: entity?.pageId ?? null,
        label: 'cita',
        createdAt: new Date().toISOString(),
        origin: 'live',
      };
      additions.push(relation);
      this.lastLiveRelationId.set(relation.id);
    }

    this.liveRelations.set([...retainedRelations, ...additions]);
  }

  private toRelationViews(relations: WorkshopRelation[]): WorkshopRelationView[] {
    return relations.map((relation) => ({
      ...relation,
      sourcePage: this.pageById(relation.sourcePageId),
      targetPage: relation.targetPageId ? this.pageById(relation.targetPageId) : null,
      entity: this.entityById(relation.targetEntityId),
    }));
  }

  private pageById(pageId: string): WorkshopPage | null {
    return this.pages().find((page) => page.id === pageId) ?? null;
  }

  private entityById(entityId: string): WorkshopEntity | null {
    return this.entities().find((entity) => entity.id === entityId) ?? null;
  }

  private findEntityByName(name: string): WorkshopEntity | null {
    const normalized = normalizeEntityName(name);
    return this.entities().find((entity) => normalizeEntityName(entity.name) === normalized) ?? null;
  }
}
