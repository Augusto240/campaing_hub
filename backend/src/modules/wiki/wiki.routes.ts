import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { canManageCampaign, isCampaignMember } from '../../middlewares/permission.middleware';
import {
  addWikiFavorite,
  bootstrapLegacyWiki,
  createWikiFromTemplate,
  createWikiPage,
  deleteWikiPage,
  getCampaignWikiFavorites,
  getCampaignWikiPages,
  getCampaignWikiTree,
  getWikiMentionSuggestions,
  getWikiPageById,
  getWikiPageBlocks,
  getWikiPageRelations,
  getWikiTemplates,
  removeWikiFavorite,
  seedLegacyWikiContent,
  upsertWikiPageBlocks,
  updateWikiPage,
} from './wiki.controller';

const router = Router();

router.use(authenticate);

router.get('/templates', getWikiTemplates);
router.post('/campaign/:campaignId/bootstrap-legacy', canManageCampaign, bootstrapLegacyWiki);
router.post('/campaign/:campaignId/from-template', isCampaignMember, createWikiFromTemplate);
router.get('/campaign/:campaignId', isCampaignMember, getCampaignWikiPages);
router.get('/campaign/:campaignId/tree', isCampaignMember, getCampaignWikiTree);
router.post('/campaign/:campaignId/seed-legacy', isCampaignMember, seedLegacyWikiContent);
router.get('/campaign/:campaignId/favorites', isCampaignMember, getCampaignWikiFavorites);
router.get('/campaign/:campaignId/mentions', isCampaignMember, getWikiMentionSuggestions);
router.get('/:wikiPageId/relations', isCampaignMember, getWikiPageRelations);
router.get('/:wikiPageId/blocks', isCampaignMember, getWikiPageBlocks);
router.put('/:wikiPageId/blocks', isCampaignMember, upsertWikiPageBlocks);
router.post('/:wikiPageId/favorite', isCampaignMember, addWikiFavorite);
router.delete('/:wikiPageId/favorite', isCampaignMember, removeWikiFavorite);
router.get('/:wikiPageId', isCampaignMember, getWikiPageById);
router.post('/', isCampaignMember, createWikiPage);
router.put('/:wikiPageId', isCampaignMember, updateWikiPage);
router.delete('/:wikiPageId', isCampaignMember, deleteWikiPage);

export default router;

