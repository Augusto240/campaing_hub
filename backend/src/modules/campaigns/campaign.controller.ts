import { Response, NextFunction } from 'express';
import { CampaignService } from './campaign.service';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { validate } from '../../utils/validation';
import {
  addCampaignMemberSchema,
  campaignIdParamsSchema,
  createCampaignSchema,
  removeCampaignMemberParamsSchema,
  updateCampaignSchema,
} from './campaign.validation';

const campaignService = new CampaignService();

export const createCampaign = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, description, system } = validate(createCampaignSchema, req.body);

    const campaign = await campaignService.createCampaign(
      req.user!.id,
      name,
      description,
      system
    );

    res.status(201).json(success(campaign, 'Campaign created successfully'));
  }
);

export const getCampaigns = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const campaigns = await campaignService.getUserCampaigns(req.user!.id);

    res.json(success(campaigns, 'Campaigns retrieved successfully'));
  }
);

export const getCampaignById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const campaign = await campaignService.getCampaignById(campaignId);

    res.json(success(campaign, 'Campaign retrieved successfully'));
  }
);

export const updateCampaign = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { name, description, system } = validate(updateCampaignSchema, req.body);

    const campaign = await campaignService.updateCampaign(campaignId, {
      name,
      description,
      system,
    });

    res.json(success(campaign, 'Campaign updated successfully'));
  }
);

export const deleteCampaign = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    await campaignService.deleteCampaign(campaignId);

    res.json(success(null, 'Campaign deleted successfully'));
  }
);

export const addMember = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);
    const { userId, role } = validate(addCampaignMemberSchema, req.body);

    const member = await campaignService.addMember(campaignId, userId, role);

    res.status(201).json(success(member, 'Member added successfully'));
  }
);

export const removeMember = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId, userId } = validate(removeCampaignMemberParamsSchema, req.params);

    await campaignService.removeMember(campaignId, userId);

    res.json(success(null, 'Member removed successfully'));
  }
);

export const getCampaignStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const stats = await campaignService.getCampaignStats(campaignId);

    res.json(success(stats, 'Campaign stats retrieved successfully'));
  }
);

export const exportCampaignData = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const csv = await campaignService.exportCampaignData(campaignId);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="campaign-${campaignId}.csv"`);
    res.send(csv);
  }
);
