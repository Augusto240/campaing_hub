import { prisma } from '../../config/database';

export type CampaignAccess = {
  campaignId: string;
  isGM: boolean;
};

export const resolveCampaignAccess = async (
  campaignId: string,
  userId: string
): Promise<CampaignAccess | null> => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      ownerId: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const isOwner = campaign.ownerId === userId;
  const isMember = isOwner || campaign.members.length > 0;
  if (!isMember) {
    return null;
  }

  return {
    campaignId: campaign.id,
    isGM: isOwner || campaign.members.some((member) => member.role === 'GM'),
  };
};
