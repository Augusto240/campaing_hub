import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember } from '../../middlewares/permission.middleware';
import {
  createWikiPage,
  deleteWikiPage,
  getCampaignWikiPages,
  getCampaignWikiTree,
  getWikiPageById,
  seedLegacyWikiContent,
  updateWikiPage,
} from './wiki.controller';

const router = Router();

router.use(authenticate);

router.get('/campaign/:campaignId', isCampaignMember, getCampaignWikiPages);
router.get('/campaign/:campaignId/tree', isCampaignMember, getCampaignWikiTree);
router.post('/campaign/:campaignId/seed-legacy', isCampaignMember, seedLegacyWikiContent);
router.get('/:wikiPageId', isCampaignMember, getWikiPageById);
router.post('/', isCampaignMember, createWikiPage);
router.put('/:wikiPageId', isCampaignMember, updateWikiPage);
router.delete('/:wikiPageId', isCampaignMember, deleteWikiPage);

export default router;

