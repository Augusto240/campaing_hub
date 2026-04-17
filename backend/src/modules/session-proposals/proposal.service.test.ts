import { AppError } from '../../utils/error-handler';

declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

const mockTx = {
  sessionProposal: {
    update: jest.fn(),
  },
  notification: {
    createMany: jest.fn(),
  },
};

const mockPrisma = {
  sessionProposal: {
    findUnique: jest.fn(),
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

import { SessionProposalService } from './proposal.service';

describe('SessionProposalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx)
    );
  });

  it('should cancel an open proposal and notify campaign members', async () => {
    mockPrisma.sessionProposal.findUnique.mockResolvedValue({
      id: 'proposal-1',
      status: 'OPEN',
      campaign: {
        id: 'campaign-1',
        name: 'Arkham by Night',
        ownerId: 'owner-1',
        members: [{ userId: 'gm-2' }, { userId: 'player-1' }],
      },
    });

    mockTx.sessionProposal.update.mockResolvedValue({
      id: 'proposal-1',
      status: 'CANCELLED',
      decidedDate: null,
      votes: [],
      proposer: {
        id: 'owner-1',
        name: 'GM',
        email: 'gm@example.com',
      },
    });

    const service = new SessionProposalService();
    const proposal = await service.cancelProposal('proposal-1');

    expect(mockTx.sessionProposal.update).toHaveBeenCalledWith({
      where: { id: 'proposal-1' },
      data: {
        status: 'CANCELLED',
        decidedDate: null,
      },
      include: {
        votes: true,
        proposer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    expect(mockTx.notification.createMany).toHaveBeenCalled();
    expect(emitCampaignEvent).toHaveBeenCalledWith(
      'campaign-1',
      'session-proposal:cancelled',
      proposal
    );
  });

  it('should reject cancellation for non-open proposals', async () => {
    mockPrisma.sessionProposal.findUnique.mockResolvedValue({
      id: 'proposal-1',
      status: 'DECIDED',
      campaign: {
        id: 'campaign-1',
        name: 'Arkham by Night',
        ownerId: 'owner-1',
        members: [],
      },
    });

    const service = new SessionProposalService();

    await expect(service.cancelProposal('proposal-1')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Only open session proposals can be cancelled',
    } as AppError);
  });
});
