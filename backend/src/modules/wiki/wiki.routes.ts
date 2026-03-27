import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { canManageCampaign, isCampaignMember } from '../../middlewares/permission.middleware';
import {
  bootstrapLegacyWiki,
  createWikiPage,
  deleteWikiPage,
  getCampaignWikiPages,
  getWikiPageById,
  updateWikiPage,
} from './wiki.controller';

const router = Router();

router.use(authenticate);

router.post('/campaign/:campaignId/bootstrap-legacy', canManageCampaign, bootstrapLegacyWiki);
router.get('/campaign/:campaignId', isCampaignMember, getCampaignWikiPages);
router.get('/:wikiPageId', isCampaignMember, getWikiPageById);
router.post('/', isCampaignMember, createWikiPage);
router.put('/:wikiPageId', isCampaignMember, updateWikiPage);
router.delete('/:wikiPageId', isCampaignMember, deleteWikiPage);

export default router;

