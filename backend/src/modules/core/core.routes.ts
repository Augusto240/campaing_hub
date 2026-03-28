import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember, isGM } from '../../middlewares/permission.middleware';
import {
  createCoreHomebrewEntry,
  createCorePage,
  getCoreBacklinks,
  getCoreCampaignSnapshot,
  getCoreCompendium,
  getCoreVttState,
  searchCoreKnowledge,
  upsertCorePageBlocks,
  upsertCoreVttState,
} from './core.controller';

const router = Router();

router.use(authenticate);

router.get('/campaign/:campaignId/snapshot', isCampaignMember, getCoreCampaignSnapshot);
router.get('/campaign/:campaignId/search', isCampaignMember, searchCoreKnowledge);
router.post('/campaign/:campaignId/pages', isCampaignMember, createCorePage);
router.get('/campaign/:campaignId/compendium', isCampaignMember, getCoreCompendium);
router.post('/campaign/:campaignId/compendium/homebrew', isGM, createCoreHomebrewEntry);
router.get('/campaign/:campaignId/vtt-state', isCampaignMember, getCoreVttState);
router.put('/campaign/:campaignId/vtt-state', isGM, upsertCoreVttState);
router.get('/pages/:wikiPageId/backlinks', isCampaignMember, getCoreBacklinks);
router.put('/pages/:wikiPageId/blocks', isCampaignMember, upsertCorePageBlocks);

export default router;
