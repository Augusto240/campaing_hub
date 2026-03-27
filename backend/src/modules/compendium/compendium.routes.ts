import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember } from '../../middlewares/permission.middleware';
import {
  getCampaignCompendium,
  getCampaignCompendiumKinds,
  getSystemCompendium,
} from './compendium.controller';

const router = Router();

router.use(authenticate);

router.get('/campaign/:campaignId', isCampaignMember, getCampaignCompendium);
router.get('/campaign/:campaignId/kinds', isCampaignMember, getCampaignCompendiumKinds);
router.get('/system/:systemSlug', getSystemCompendium);

export default router;
