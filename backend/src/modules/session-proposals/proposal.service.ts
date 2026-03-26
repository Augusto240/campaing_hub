import { prisma } from '../../config/database';
import { emitCampaignEvent } from '../../config/realtime';
import { AppError } from '../../utils/error-handler';

export class SessionProposalService {
  async createProposal(campaignId: string, proposedBy: string, dates: Date[]) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const createdProposal = await tx.sessionProposal.create({
        data: {
          campaignId,
          proposedBy,
          dates,
        },
        include: {
          votes: true,
        },
      });

      const recipients = new Set<string>(campaign.members.map((member) => member.userId));
      recipients.add(campaign.ownerId);
      recipients.delete(proposedBy);

      if (recipients.size > 0) {
        await tx.notification.createMany({
          data: Array.from(recipients).map((userId) => ({
            userId,
            message: `New session dates were proposed in campaign "${campaign.name}".`,
          })),
        });
      }

      return createdProposal;
    });

    emitCampaignEvent(campaignId, 'session-proposal:created', proposal);
    return proposal;
  }

  async listCampaignProposals(campaignId: string) {
    return prisma.sessionProposal.findMany({
      where: { campaignId },
      include: {
        votes: {
          orderBy: [{ date: 'asc' }],
        },
        proposer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async voteProposal(proposalId: string, userId: string, date: Date, available: boolean) {
    const proposal = await prisma.sessionProposal.findUnique({
      where: { id: proposalId },
      include: {
        campaign: {
          select: { id: true },
        },
      },
    });

    if (!proposal) {
      throw new AppError(404, 'Session proposal not found');
    }

    if (proposal.status !== 'OPEN') {
      throw new AppError(400, 'This session proposal is not open for voting');
    }

    const isValidDate = proposal.dates.some((candidate) => candidate.getTime() === date.getTime());
    if (!isValidDate) {
      throw new AppError(400, 'Vote date must belong to the proposed options');
    }

    const vote = await prisma.sessionVote.upsert({
      where: {
        proposalId_userId_date: {
          proposalId,
          userId,
          date,
        },
      },
      update: {
        available,
      },
      create: {
        proposalId,
        userId,
        date,
        available,
      },
    });

    emitCampaignEvent(proposal.campaign.id, 'session-proposal:voted', {
      proposalId,
      userId,
      date,
      available,
    });

    return vote;
  }

  async decideProposal(proposalId: string, decidedDate: Date) {
    const proposal = await prisma.sessionProposal.findUnique({
      where: { id: proposalId },
      include: {
        campaign: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!proposal) {
      throw new AppError(404, 'Session proposal not found');
    }

    const isValidDate = proposal.dates.some((candidate) => candidate.getTime() === decidedDate.getTime());
    if (!isValidDate) {
      throw new AppError(400, 'Decided date must belong to the proposed options');
    }

    const updatedProposal = await prisma.$transaction(async (tx) => {
      const decidedProposal = await tx.sessionProposal.update({
        where: { id: proposalId },
        data: {
          decidedDate,
          status: 'DECIDED',
        },
        include: {
          votes: true,
          proposer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const recipients = new Set<string>(proposal.campaign.members.map((member) => member.userId));
      recipients.add(proposal.campaign.ownerId);

      if (recipients.size > 0) {
        await tx.notification.createMany({
          data: Array.from(recipients).map((userId) => ({
            userId,
            message: `Next session for "${proposal.campaign.name}" was scheduled for ${decidedDate.toISOString()}.`,
          })),
        });
      }

      return decidedProposal;
    });

    emitCampaignEvent(proposal.campaign.id, 'session-proposal:decided', updatedProposal);
    return updatedProposal;
  }
}
