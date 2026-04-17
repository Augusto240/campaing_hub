import { AppError } from '../../utils/error-handler';

declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

const mockTx = {
  combatant: {
    delete: jest.fn(),
  },
  combatEncounter: {
    update: jest.fn(),
  },
};

const mockPrisma = {
  session: {
    findUnique: jest.fn(),
  },
  character: {
    findUnique: jest.fn(),
  },
  combatant: {
    create: jest.fn(),
    update: jest.fn(),
  },
  combatEncounter: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const emitCampaignEvent = jest.fn();

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../config/realtime', () => ({
  emitCampaignEvent,
}));

import { CombatService } from './combat.service';

describe('CombatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx)
    );
  });

  it('should remove a combatant and rebalance the active turn', async () => {
    const initialEncounter = {
      id: 'enc-1',
      currentTurn: 1,
      round: 3,
      combatants: [
        { id: 'cmb-1', name: 'Goblin 1' },
        { id: 'cmb-2', name: 'Goblin 2' },
      ],
      session: {
        campaignId: 'campaign-1',
      },
    };

    const updatedEncounter = {
      ...initialEncounter,
      currentTurn: 0,
      combatants: [{ id: 'cmb-1', name: 'Goblin 1' }],
    };

    mockPrisma.combatEncounter.findUnique
      .mockResolvedValueOnce(initialEncounter)
      .mockResolvedValueOnce(updatedEncounter);

    const service = new CombatService();
    await service.removeCombatant('enc-1', 'cmb-2');

    expect(mockTx.combatant.delete).toHaveBeenCalledWith({
      where: { id: 'cmb-2' },
    });
    expect(mockTx.combatEncounter.update).toHaveBeenCalledWith({
      where: { id: 'enc-1' },
      data: {
        currentTurn: 0,
      },
    });
    expect(emitCampaignEvent).toHaveBeenCalledWith('campaign-1', 'combat:updated', updatedEncounter);
  });

  it('should reject removal when combatant does not belong to the encounter', async () => {
    mockPrisma.combatEncounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentTurn: 0,
      round: 1,
      combatants: [{ id: 'cmb-1', name: 'Goblin 1' }],
      session: {
        campaignId: 'campaign-1',
      },
    });

    const service = new CombatService();

    await expect(service.removeCombatant('enc-1', 'cmb-9')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Combatant not found',
    } as AppError);
  });
});
