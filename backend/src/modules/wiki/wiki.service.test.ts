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
  wikiPage: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
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
  });

  it('should reject parent pages from another campaign', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'user-1',
      members: [],
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
});
