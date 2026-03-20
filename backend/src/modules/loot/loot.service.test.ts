import { AppError } from '../../utils/error-handler';

const mockTx = {
  loot: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  character: {
    findUnique: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
};

const mockPrisma = {
  loot: mockTx.loot,
  character: mockTx.character,
  notification: mockTx.notification,
  $transaction: jest.fn(),
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

import { LootService } from './loot.service';

describe('LootService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx)
    );
  });

  it('should reject assigning loot to a character from another campaign', async () => {
    mockTx.loot.findUnique.mockResolvedValue({
      id: 'loot-1',
      session: {
        campaignId: 'campaign-a',
      },
    });
    mockTx.character.findUnique.mockResolvedValue({
      id: 'character-2',
      campaignId: 'campaign-b',
    });

    const service = new LootService();

    await expect(service.assignLoot('loot-1', 'character-2')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_RELATION',
    } as AppError);

    expect(mockTx.loot.update).not.toHaveBeenCalled();
    expect(mockTx.notification.create).not.toHaveBeenCalled();
  });
});
