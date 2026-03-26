import { Response, NextFunction } from 'express';
import { AppError } from '../utils/error-handler';
import { prisma } from '../config/database';
import { AuthRequest } from './auth.middleware';

const requireUser = (req: AuthRequest) => {
  if (!req.user?.id) {
    throw new AppError(401, 'Not authenticated');
  }

  return req.user;
};

const resolveCampaignId = async (req: AuthRequest): Promise<string | null> => {
  const directCampaignId = req.params.campaignId || req.body.campaignId;
  if (directCampaignId) {
    return directCampaignId;
  }

  const sessionId = req.params.sessionId || req.body.sessionId;
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { campaignId: true },
    });
    if (session) {
      return session.campaignId;
    }
  }

  const lootId = req.params.lootId || req.body.lootId;
  if (lootId) {
    const loot = await prisma.loot.findUnique({
      where: { id: lootId },
      select: {
        session: {
          select: {
            campaignId: true,
          },
        },
      },
    });
    if (loot) {
      return loot.session.campaignId;
    }
  }

  const characterId = req.params.characterId || req.body.characterId;
  if (characterId) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { campaignId: true },
    });
    if (character) {
      return character.campaignId;
    }
  }

  const wikiPageId = req.params.wikiPageId || req.body.wikiPageId;
  if (wikiPageId) {
    const wikiPage = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
      select: { campaignId: true },
    });
    if (wikiPage) {
      return wikiPage.campaignId;
    }
  }

  const diceRollId = req.params.diceRollId || req.body.diceRollId;
  if (diceRollId) {
    const diceRoll = await prisma.diceRoll.findUnique({
      where: { id: diceRollId },
      select: { campaignId: true },
    });
    if (diceRoll) {
      return diceRoll.campaignId;
    }
  }

  const encounterId = req.params.encounterId || req.body.encounterId;
  if (encounterId) {
    const encounter = await prisma.combatEncounter.findUnique({
      where: { id: encounterId },
      select: {
        session: {
          select: {
            campaignId: true,
          },
        },
      },
    });
    if (encounter) {
      return encounter.session.campaignId;
    }
  }

  const proposalId = req.params.proposalId || req.body.proposalId;
  if (proposalId) {
    const proposal = await prisma.sessionProposal.findUnique({
      where: { id: proposalId },
      select: { campaignId: true },
    });
    if (proposal) {
      return proposal.campaignId;
    }
  }

  return null;
};

export const canManageCampaign = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const campaignId = req.params.campaignId || req.body.campaignId;

    if (!campaignId) {
      throw new AppError(400, 'Campaign ID required');
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    if (campaign.ownerId === user.id) {
      return next();
    }

    const member = campaign.members[0];
    if (member && member.role === 'GM') {
      return next();
    }

    throw new AppError(403, 'Only campaign owner or GM can perform this action');
  } catch (error) {
    next(error);
  }
};

export const canDeleteCampaign = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const campaignId = req.params.campaignId;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    if (campaign.ownerId !== user.id) {
      throw new AppError(403, 'Only campaign owner can delete the campaign');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const canManageCharacter = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const characterId = req.params.characterId || req.body.characterId;

    if (!characterId) {
      throw new AppError(400, 'Character ID required');
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        campaign: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    if (character.playerId === user.id) {
      return next();
    }

    const member = character.campaign.members[0];
    if (member && member.role === 'GM') {
      return next();
    }

    if (character.campaign.ownerId === user.id) {
      return next();
    }

    throw new AppError(403, 'You can only manage your own characters');
  } catch (error) {
    next(error);
  }
};

export const canViewCharacter = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const characterId = req.params.characterId || req.body.characterId;

    if (!characterId) {
      throw new AppError(400, 'Character ID required');
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        campaign: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!character) {
      throw new AppError(404, 'Character not found');
    }

    const isOwner = character.playerId === user.id;
    const isCampaignOwner = character.campaign.ownerId === user.id;
    const isCampaignMember = character.campaign.members.length > 0;

    if (!isOwner && !isCampaignOwner && !isCampaignMember) {
      throw new AppError(403, 'You are not allowed to view this character');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const isGM = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const campaignId = await resolveCampaignId(req);

    if (!campaignId) {
      throw new AppError(400, 'Campaign ID could not be determined');
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    if (campaign.ownerId === user.id) {
      return next();
    }

    const member = campaign.members[0];
    if (!member || member.role !== 'GM') {
      throw new AppError(403, 'Only GM can perform this action');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const isCampaignMember = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const campaignId = await resolveCampaignId(req);

    if (!campaignId) {
      throw new AppError(400, 'Campaign ID could not be determined');
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    if (campaign.ownerId === user.id) {
      return next();
    }

    if (campaign.members.length === 0) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    next();
  } catch (error) {
    next(error);
  }
};
