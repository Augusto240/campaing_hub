declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

const mockPrisma = {
  campaign: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

import { resolveCampaignAccess } from './campaign-access.service';

describe('resolveCampaignAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject users outside the campaign', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'owner-1',
      members: [],
    });

    await expect(resolveCampaignAccess('campaign-1', 'intruder-1')).resolves.toBeNull();
  });

  it('should grant GM access to campaign owner', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'owner-1',
      members: [],
    });

    await expect(resolveCampaignAccess('campaign-1', 'owner-1')).resolves.toEqual({
      campaignId: 'campaign-1',
      isGM: true,
    });
  });

  it('should grant member access and preserve non-GM role', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      ownerId: 'owner-1',
      members: [{ role: 'PLAYER' }],
    });

    await expect(resolveCampaignAccess('campaign-1', 'player-1')).resolves.toEqual({
      campaignId: 'campaign-1',
      isGM: false,
    });
  });
});
