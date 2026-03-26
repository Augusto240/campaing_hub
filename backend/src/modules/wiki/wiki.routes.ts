import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember } from '../../middlewares/permission.middleware';
import {
  createWikiPage,
  deleteWikiPage,
  getCampaignWikiPages,
  getWikiPageById,
  updateWikiPage,
  getWikiPageTree,
  getWikiFavorites,
  moveWikiPage,
  toggleWikiFavorite,
  getWikiBlocks,
  createWikiBlock,
  updateWikiBlock,
  deleteWikiBlock,
  reorderWikiBlocks,
  duplicateWikiBlock,
  getWikiBacklinks,
  getWikiOutgoingLinks,
} from './wiki.controller';

const router = Router();

router.use(authenticate);

// Campaign-scoped routes
router.get('/campaign/:campaignId', isCampaignMember, getCampaignWikiPages);
router.get('/campaign/:campaignId/tree', isCampaignMember, getWikiPageTree);
router.get('/campaign/:campaignId/favorites', isCampaignMember, getWikiFavorites);

// Block routes (need to be before :wikiPageId to avoid conflicts)
router.put('/blocks/:blockId', updateWikiBlock);
router.delete('/blocks/:blockId', deleteWikiBlock);
router.post('/blocks/:blockId/duplicate', duplicateWikiBlock);

// Page routes
router.get('/:wikiPageId', getWikiPageById);
router.post('/', isCampaignMember, createWikiPage);
router.put('/:wikiPageId', updateWikiPage);
router.delete('/:wikiPageId', deleteWikiPage);
router.post('/:wikiPageId/move', moveWikiPage);
router.post('/:wikiPageId/favorite', toggleWikiFavorite);

// Page blocks
router.get('/:wikiPageId/blocks', getWikiBlocks);
router.post('/:wikiPageId/blocks', createWikiBlock);
router.post('/:wikiPageId/blocks/reorder', reorderWikiBlocks);

// Page backlinks
router.get('/:wikiPageId/backlinks', getWikiBacklinks);
router.get('/:wikiPageId/outgoing', getWikiOutgoingLinks);

export default router;
