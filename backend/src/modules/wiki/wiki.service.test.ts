import { AppError } from '../../utils/error-handler';

declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

const mockPrisma = {
  campaign: {
    findUnique: jest.fn(),
  },
  character: {
    findMany: jest.fn(),
  },
  session: {
    findMany: jest.fn(),
  },
  item: {
    findMany: jest.fn(),
  },
  creature: {
    findMany: jest.fn(),
  },
  wikiPage: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

import { WikiService } from './wiki.service';

describe('WikiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockPrisma) => unknown) =>
      callback(mockPrisma)
    );
    mockPrisma.character.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany.mockResolvedValue([]);
    mockPrisma.item.findMany.mockResolvedValue([]);
    mockPrisma.creature.findMany.mockResolvedValue([]);
    mockPrisma.$queryRaw.mockResolvedValue([]);
  });

  it('should use PostgreSQL full-text ranking when searching wiki pages', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'user-1',
      members: [],
    });

    mockPrisma.$queryRaw.mockResolvedValue([
      { id: 'page-2' },
      { id: 'page-1' },
    ]);

    mockPrisma.wikiPage.findMany.mockResolvedValue([
      {
        id: 'page-1',
        title: 'Lore 1',
        category: 'LORE',
        tags: [],
        content: 'A',
        createdBy: 'user-1',
        isPublic: true,
        campaignId: 'campaign-1',
        createdAt: new Date('2026-03-27T10:00:00.000Z'),
        updatedAt: new Date('2026-03-27T10:00:00.000Z'),
        parentPageId: null,
        author: { id: 'user-1', name: 'GM', email: 'gm@example.com' },
        parent: null,
        _count: { children: 0 },
      },
      {
        id: 'page-2',
        title: 'Lore 2',
        category: 'LORE',
        tags: [],
        content: 'B',
        createdBy: 'user-1',
        isPublic: true,
        campaignId: 'campaign-1',
        createdAt: new Date('2026-03-27T10:00:00.000Z'),
        updatedAt: new Date('2026-03-27T10:00:00.000Z'),
        parentPageId: null,
        author: { id: 'user-1', name: 'GM', email: 'gm@example.com' },
        parent: null,
        _count: { children: 0 },
      },
    ]);

    const service = new WikiService();
    const pages = await service.listPages({
      campaignId: 'campaign-1',
      userId: 'user-1',
      search: 'arcano profundo',
      limit: 10,
    });

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(pages.map((page: { id: string }) => page.id)).toEqual(['page-2', 'page-1']);
  });

  it('should reject parent pages from another campaign', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'user-1',
      members: [],
      systemId: null,
    });

    mockPrisma.wikiPage.findUnique.mockResolvedValue({
      id: 'parent-1',
      campaignId: 'campaign-2',
      parentPageId: null,
    });

    const service = new WikiService();

    await expect(
      service.createPage({
        campaignId: 'campaign-1',
        userId: 'user-1',
        parentPageId: 'parent-1',
        title: 'Nova Pagina',
        content: 'Conteudo',
        category: 'LORE',
        tags: [],
        isPublic: true,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Parent wiki page must belong to the same campaign',
    } as AppError);

    expect(mockPrisma.wikiPage.create).not.toHaveBeenCalled();
  });

  it('should build a hierarchical tree from wiki pages', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'user-1',
      members: [],
    });

    mockPrisma.wikiPage.findMany.mockResolvedValue([
      {
        id: 'root-1',
        title: 'Atlas',
        category: 'LORE',
        parentPageId: null,
        isPublic: true,
        updatedAt: new Date('2026-03-27T10:00:00.000Z'),
      },
      {
        id: 'child-1',
        title: 'Augustus Frostborne',
        category: 'NPC',
        parentPageId: 'root-1',
        isPublic: true,
        updatedAt: new Date('2026-03-27T10:05:00.000Z'),
      },
    ]);

    const service = new WikiService();
    const tree = await service.getTree('campaign-1', 'user-1');

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('root-1');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('child-1');
  });

  it('should expose notion-style wiki templates', () => {
    const service = new WikiService();

    const templates = service.getTemplates();

    expect(templates.length).toBeGreaterThanOrEqual(3);
    expect(templates.some((template: { key: string }) => template.key === 'CHARACTER_DOSSIER')).toBe(true);
  });

  it('should resolve linked pages from modern and legacy wiki links', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'user-1',
      members: [],
    });

    mockPrisma.wikiPage.findUnique.mockResolvedValue({
      id: 'page-main',
      campaignId: 'campaign-1',
      title: 'Cronica da Sessao 12',
      content:
        'No conflito final, [[Canon 2023 - Augustus Frostborne]] segurou a linha com @Canon 2023 - Satoru Naitokira.',
      category: 'SESSION_RECAP',
      tags: ['sessao'],
      createdBy: 'user-1',
      isPublic: true,
      createdAt: new Date('2026-03-27T10:00:00.000Z'),
      updatedAt: new Date('2026-03-27T10:00:00.000Z'),
      parentPageId: null,
      author: {
        id: 'user-1',
        name: 'GM',
        email: 'gm@example.com',
      },
      parent: null,
      children: [],
    });

    mockPrisma.wikiPage.findMany
      .mockResolvedValueOnce([
        { id: 'augustus-page', title: 'Canon 2023 - Augustus Frostborne' },
        { id: 'satoru-page', title: 'Canon 2023 - Satoru Naitokira' },
        { id: 'other-page', title: 'Biblioteca de Arkham' },
      ])
      .mockResolvedValueOnce([
        {
          id: 'backlink-1',
          title: 'Relatorio dos Sobreviventes',
        },
      ]);

    const service = new WikiService();
    const page = await service.getPage('page-main', 'user-1');

    expect(page.linkedPages).toHaveLength(2);
    expect(page.linkedPages.map((entry: { id: string }) => entry.id).sort()).toEqual([
      'augustus-page',
      'satoru-page',
    ]);
    expect(page.backlinks).toHaveLength(1);

    expect(mockPrisma.wikiPage.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              content: {
                contains: '[[Cronica da Sessao 12]]',
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: '@Cronica da Sessao 12',
                mode: 'insensitive',
              },
            },
          ]),
        }),
      })
    );
  });

  it('should include legacy and modern syntax when querying relations', async () => {
    const service = new WikiService();

    jest.spyOn(service as unknown as { getPage: (wikiPageId: string, userId: string) => Promise<unknown> }, 'getPage')
      .mockResolvedValue({
        id: 'page-main',
        campaignId: 'campaign-1',
        title: 'Canon 2023 - Augustus Frostborne',
        content: 'Veja [[Canon 2023 - Satoru Naitokira]] e @Biblioteca de Arkham',
        category: 'NPC',
        tags: [],
        parentPageId: null,
        parent: null,
        children: [],
      });

    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'user-1',
      members: [],
    });

    mockPrisma.wikiPage.findMany
      .mockResolvedValueOnce([
        {
          id: 'backlink-1',
          title: 'Relatorio de Batalha',
          category: 'SESSION_RECAP',
          updatedAt: new Date('2026-03-27T10:30:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'outgoing-1',
          title: 'Canon 2023 - Satoru Naitokira',
          category: 'NPC',
          updatedAt: new Date('2026-03-27T10:35:00.000Z'),
        },
        {
          id: 'outgoing-2',
          title: 'Biblioteca de Arkham',
          category: 'LOCATION',
          updatedAt: new Date('2026-03-27T10:36:00.000Z'),
        },
      ]);

    const relations = await service.getPageRelations('page-main', 'user-1', 8);

    expect(relations.backlinks).toHaveLength(1);
    expect(relations.outgoingLinks).toHaveLength(2);
    expect(relations.entityBacklinks).toHaveLength(0);
    expect(relations.outgoingEntities).toHaveLength(0);

    expect(mockPrisma.wikiPage.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              content: {
                contains: '[[Canon 2023 - Augustus Frostborne]]',
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: '@Canon 2023 - Augustus Frostborne',
                mode: 'insensitive',
              },
            },
          ]),
        }),
      })
    );

    expect(mockPrisma.wikiPage.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              title: {
                equals: 'Canon 2023 - Satoru Naitokira',
                mode: 'insensitive',
              },
            },
            {
              title: {
                equals: 'Biblioteca de Arkham',
                mode: 'insensitive',
              },
            },
          ]),
        }),
      })
    );
  });
});
