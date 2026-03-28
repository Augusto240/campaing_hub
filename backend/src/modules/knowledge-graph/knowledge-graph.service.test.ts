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
    findMany: jest.fn(),
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
  combatant: {
    findMany: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../compendium/compendium.data', () => ({
  filterCompendiumEntries: jest.fn().mockReturnValue([
    {
      id: 'comp-1',
      name: 'Espada Longa',
      kind: 'ITEM',
      tags: ['arma'],
    },
  ]),
}));

import { KnowledgeGraphService } from './knowledge-graph.service';

describe('KnowledgeGraphService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'owner-1',
      system: 'dnd5e',
      systemTemplate: { slug: 'dnd5e' },
      members: [{ id: 'member-1' }],
    });

    mockPrisma.wikiPage.findMany.mockResolvedValue([
      {
        id: 'wiki-1',
        title: 'Canon 2023 - Augustus Frostborne',
        content: 'Aliado de [[Sessao da Aurora]] e @Espada Longa',
        category: 'NPC',
        tags: ['canon-2023'],
        legacySource: 'legacy:augustus',
        updatedAt: new Date('2026-03-27T10:00:00.000Z'),
      },
    ]);

    mockPrisma.character.findMany.mockResolvedValue([
      {
        id: 'char-1',
        name: 'Satoru Naitokira',
        notes: 'Mestre de armas',
        inventory: [{ name: 'Espada Longa' }],
        updatedAt: new Date('2026-03-27T10:10:00.000Z'),
      },
    ]);

    mockPrisma.session.findMany.mockResolvedValue([
      {
        id: 'sess-1',
        date: new Date('2026-03-27T09:00:00.000Z'),
        summary: 'Sessao da Aurora',
        narrativeLog: 'Combate inicial',
        updatedAt: new Date('2026-03-27T09:30:00.000Z'),
      },
    ]);

    mockPrisma.item.findMany.mockResolvedValue([
      {
        id: 'item-1',
        name: 'Espada Longa',
        description: 'Lamina ancestral',
      },
    ]);

    mockPrisma.creature.findMany.mockResolvedValue([]);

    mockPrisma.combatant.findMany.mockResolvedValue([
      {
        id: 'comb-1',
        name: 'Satoru',
        characterId: 'char-1',
        encounter: {
          sessionId: 'sess-1',
        },
      },
    ]);
  });

  it('should build graph with nodes, edges and legacy markers', async () => {
    const service = new KnowledgeGraphService();

    const graph = await service.buildCampaignGraph('campaign-1', 'user-1', 120);

    expect(graph.stats.nodes).toBeGreaterThanOrEqual(4);
    expect(graph.stats.edges).toBeGreaterThanOrEqual(3);
    expect(graph.stats.legacyAnchors).toBeGreaterThanOrEqual(2);

    expect(graph.edges.some((edge: { type: string }) => edge.type === 'WIKI_MENTION')).toBe(true);
    expect(graph.edges.some((edge: { type: string }) => edge.type === 'SESSION_COMBATANT')).toBe(true);
    expect(graph.edges.some((edge: { type: string }) => edge.type === 'CHARACTER_ITEM')).toBe(true);
  });

  it('should reject non-member access to campaign graph', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValueOnce({
      id: 'campaign-1',
      ownerId: 'owner-1',
      system: 'dnd5e',
      systemTemplate: { slug: 'dnd5e' },
      members: [],
    });

    const service = new KnowledgeGraphService();

    await expect(service.buildCampaignGraph('campaign-1', 'intruder-user', 120)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You are not a member of this campaign',
    } as AppError);
  });
});
