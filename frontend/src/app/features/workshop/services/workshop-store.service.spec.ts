import { TestBed } from '@angular/core/testing';
import { MockDataService } from './mock-data.service';
import { WorkshopStoreService, extractEntityMentions } from './workshop-store.service';
import { WorkshopSeed } from '../workshop.types';

const seed: WorkshopSeed = {
  pages: [
    {
      id: 'root',
      title: 'Root',
      parentId: null,
      summary: 'Root page',
      tags: ['root'],
      updatedAt: '2026-05-27T10:00:00.000Z',
      blocks: [{ id: 'root-block', type: 'paragraph', content: 'Root content' }],
    },
    {
      id: 'augustus',
      title: 'Augustus Frostborne',
      parentId: 'root',
      summary: 'Target entity page',
      tags: ['character'],
      updatedAt: '2026-05-27T10:01:00.000Z',
      blocks: [{ id: 'augustus-block', type: 'paragraph', content: 'Character dossier' }],
    },
    {
      id: 'session-01',
      title: 'Sessao 01',
      parentId: 'root',
      summary: 'Demo session',
      tags: ['session'],
      updatedAt: '2026-05-27T10:02:00.000Z',
      blocks: [
        { id: 'session-title', type: 'heading', content: 'Sessao 01' },
        { id: 'session-empty', type: 'paragraph', content: '' },
      ],
    },
  ],
  entities: [
    {
      id: 'entity-augustus',
      name: 'Augustus Frostborne',
      type: 'character',
      summary: 'Mago do legado',
      pageId: 'augustus',
    },
  ],
  relations: [],
  timeline: [],
};

class FakeMockDataService {
  loadSeed(): Promise<WorkshopSeed> {
    return Promise.resolve(JSON.parse(JSON.stringify(seed)) as WorkshopSeed);
  }
}

describe('WorkshopStoreService', () => {
  let store: WorkshopStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MockDataService, useClass: FakeMockDataService }],
    });

    store = TestBed.inject(WorkshopStoreService);
  });

  it('loads seed data and derives a hierarchical tree', async () => {
    await store.load();

    expect(store.selectedPage()?.id).toBe('session-01');
    expect(store.pageTree()[0].id).toBe('root');
    expect(store.flatTree().map((node) => node.id)).toContain('augustus');
  });

  it('converts a slash block into a selected block type', async () => {
    await store.load();

    store.updateBlockContent('session-empty', '/');
    store.setBlockType('session-empty', 'callout');

    const block = store.selectedBlocks().find((entry) => entry.id === 'session-empty');
    expect(block?.type).toBe('callout');
    expect(block?.content).toBe('');
  });

  it('inserts a new block after the selected block', async () => {
    await store.load();

    store.insertBlockAfter('session-title', 'quote');

    const blocks = store.selectedBlocks();
    expect(blocks[1].type).toBe('quote');
    expect(blocks[1].id).toContain('session-01-live-block');
  });

  it('creates a semantic relation from a known entity mention', async () => {
    await store.load();

    store.updateBlockContent('session-empty', 'Nova pista: @Augustus Frostborne');

    const liveRelation = store.selectedOutgoingRelations().find((relation) => relation.origin === 'live');
    expect(liveRelation?.entity?.name).toBe('Augustus Frostborne');
    expect(liveRelation?.targetPage?.id).toBe('augustus');
  });

  it('updates backlinks and timeline after a live relation is created', async () => {
    await store.load();
    store.updateBlockContent('session-empty', 'Nova pista: @Augustus Frostborne');

    store.selectPage('augustus');

    expect(store.selectedBacklinks().some((relation) => relation.sourcePage?.id === 'session-01')).toBeTrue();
    expect(store.timeline().some((entry) => entry.kind === 'relation' && entry.pageId === 'session-01')).toBeTrue();
  });

  it('adds a graph edge for live semantic relations', async () => {
    await store.load();
    store.updateBlockContent('session-empty', 'Nova pista: @Augustus Frostborne');

    expect(
      store
        .graphView()
        .edges.some((edge) => edge.source === 'page:session-01' && edge.target === 'page:augustus')
    ).toBeTrue();
  });

  it('extracts entity mentions from block text', () => {
    expect(extractEntityMentions('Conectar @Augustus Frostborne e @Indice Vivo.')).toEqual([
      'Augustus Frostborne',
      'Indice Vivo',
    ]);
  });
});
