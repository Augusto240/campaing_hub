import { Router } from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  addMember,
  removeMember,
  getCampaignStats,
  exportCampaignData,
  generateEncounter,
} from './campaign.controller';
import {
  createSessionProposal,
  listCampaignProposals,
} from '../session-proposals/proposal.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { canDeleteCampaign, canManageCampaign, isCampaignMember } from '../../middlewares/permission.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:campaignId', isCampaignMember, getCampaignById);
router.put('/:campaignId', canManageCampaign, updateCampaign);
router.delete('/:campaignId', canDeleteCampaign, deleteCampaign);
router.post('/:campaignId/members', canManageCampaign, addMember);
router.delete('/:campaignId/members/:userId', canManageCampaign, removeMember);
router.get('/:campaignId/stats', isCampaignMember, getCampaignStats);
router.get('/:campaignId/export', isCampaignMember, exportCampaignData);
router.post('/:campaignId/generate-encounter', canManageCampaign, generateEncounter);
router.post('/:campaignId/session-proposals', canManageCampaign, createSessionProposal);
router.get('/:campaignId/session-proposals', isCampaignMember, listCampaignProposals);

export default router;
