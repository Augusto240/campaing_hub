const mockTx = {
  campaign: {
    create: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn(),
};

const mockDeleteCacheValue = jest.fn();

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../config/redis', () => ({
  withCache: jest.fn(),
  deleteCacheValue: (...args: unknown[]) => mockDeleteCacheValue(...args),
  deleteCacheByPattern: jest.fn(),
  CacheKeys: {
    campaign: (id: string) => `campaign:${id}`,
    campaignStats: (id: string) => `campaign:${id}:stats`,
    userCampaigns: (userId: string) => `user:${userId}:campaigns`,
  },
  CacheTTL: {
    CAMPAIGN: 300,
    CAMPAIGN_STATS: 60,
    USER_CAMPAIGNS: 120,
  },
}));

jest.mock('../rpg-systems/rpg-system.service', () => ({
  RpgSystemService: jest.fn().mockImplementation(() => ({
    resolveSystemFromInput: jest.fn().mockResolvedValue({
      id: 'system-1',
      slug: 'dnd5e',
    }),
  })),
}));

import { CampaignService } from './campaign.service';

describe('CampaignService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx)
    );
  });

  it('should invalidate user campaigns and dashboard cache after creating campaign', async () => {
    const createdCampaign = {
      id: 'campaign-1',
      name: 'A Maldicao de Strahd',
      system: 'dnd5e',
      ownerId: 'user-1',
    };

    mockTx.campaign.create.mockResolvedValue(createdCampaign);
    mockTx.activityLog.create.mockResolvedValue({ id: 'activity-1' });

    const service = new CampaignService();
    const result = await service.createCampaign(
      'user-1',
      'A Maldicao de Strahd',
      'Descricao de teste',
      'dnd5e'
    );

    expect(result).toEqual(createdCampaign);
    expect(mockDeleteCacheValue).toHaveBeenCalledWith('user:user-1:campaigns');
    expect(mockDeleteCacheValue).toHaveBeenCalledWith('dashboard:user-1');
  });
});
