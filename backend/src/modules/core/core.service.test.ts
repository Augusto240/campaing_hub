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
  compendiumCoreEntry: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockDeleteCacheByPattern = jest.fn();
const mockDeleteCacheValue = jest.fn();
const mockEmitCampaignEvent = jest.fn();

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../config/redis', () => ({
  deleteCacheByPattern: (...args: unknown[]) => mockDeleteCacheByPattern(...args),
  deleteCacheValue: (...args: unknown[]) => mockDeleteCacheValue(...args),
}));

jest.mock('../../config/realtime', () => ({
  emitCampaignEvent: (...args: unknown[]) => mockEmitCampaignEvent(...args),
}));

jest.mock('../compendium/compendium.data', () => ({
  filterCompendiumEntries: jest.fn().mockReturnValue([
    {
      id: 'dnd5e-spell-fireball',
      systemSlug: 'dnd5e',
      kind: 'SPELL',
      source: 'SRD',
      name: 'Fireball',
      summary: 'Explosao em area',
      tags: ['evocation'],
      payload: {
        level: 3,
      },
    },
  ]),
}));

import { CoreService } from './core.service';

describe('CoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'owner-1',
      system: 'dnd5e',
      systemTemplate: { slug: 'dnd5e' },
      members: [{ role: 'GM' }],
    });

    mockPrisma.compendiumCoreEntry.findMany.mockResolvedValue([
      {
        id: 'homebrew-1',
        systemSlug: 'dnd5e',
        kind: 'CREATURE',
        source: 'HOMEBREW',
        name: 'Urso Sombrio',
        summary: 'Fera envolta em trevas',
        tags: ['shadow'],
        content: { cr: 4 },
      },
    ]);
  });

  it('mescla compendio estatico com homebrew da campanha', async () => {
    const service = new CoreService();

    const result = await service.listCompendium({
      campaignId: 'campaign-1',
      userId: 'owner-1',
      limit: 30,
    });

    expect(result.systemSlug).toBe('dnd5e');
    expect(result.spells.some((entry: { name: string }) => entry.name === 'Fireball')).toBe(true);
    expect(result.creatures.some((entry: { name: string }) => entry.name === 'Urso Sombrio')).toBe(true);
  });

  it('bloqueia criacao de homebrew para usuario sem papel GM', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValueOnce({
      id: 'campaign-1',
      ownerId: 'owner-1',
      system: 'dnd5e',
      systemTemplate: { slug: 'dnd5e' },
      members: [{ role: 'PLAYER' }],
    });

    const service = new CoreService();

    await expect(
      service.createHomebrewEntry({
        campaignId: 'campaign-1',
        userId: 'player-1',
        kind: 'SPELL',
        name: 'Lanca de Cinzas',
        summary: 'Magia de fogo residual',
        tags: ['fire'],
        content: { level: 2 },
        source: 'HOMEBREW',
        linkedWikiPageIds: [],
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only GM can create compendium entries for this campaign',
    } as AppError);
  });

  it('cria homebrew e invalida cache da campanha', async () => {
    const tx = {
      compendiumCoreEntry: {
        create: jest.fn().mockResolvedValue({
          id: 'homebrew-2',
          name: 'Espada de Vidro Negro',
          kind: 'ITEM',
        }),
      },
      coreNode: {
        upsert: jest.fn().mockResolvedValue({ id: 'node-1' }),
      },
      wikiPage: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      coreRelation: {
        upsert: jest.fn(),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (handler: (trx: typeof tx) => Promise<unknown>) => {
      return handler(tx);
    });

    const service = new CoreService();

    const created = await service.createHomebrewEntry({
      campaignId: 'campaign-1',
      userId: 'owner-1',
      kind: 'ITEM',
      name: 'Espada de Vidro Negro',
      summary: 'Lamina ritualistica da era antiga',
      tags: ['legacy'],
      content: { rarity: 'rare' },
      source: 'HOMEBREW',
      linkedWikiPageIds: [],
    });

    expect(created.id).toBe('homebrew-2');
    expect(mockDeleteCacheByPattern).toHaveBeenCalledWith('core:campaign-1:*');
    expect(mockDeleteCacheByPattern).toHaveBeenCalledWith('campaign:campaign-1:wiki*');
    expect(mockDeleteCacheValue).toHaveBeenCalledWith('campaign:campaign-1:vtt-state');
    expect(mockEmitCampaignEvent).toHaveBeenCalledWith(
      'campaign-1',
      'core:compendium_created',
      expect.objectContaining({
        entryId: 'homebrew-2',
      })
    );
  });
});
