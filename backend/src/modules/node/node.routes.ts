import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember, isGM } from '../../middlewares/permission.middleware';
import {
  attachCharacterToNode,
  createCampaignNode,
  createCampaignWikiNode,
  createNodeRelation,
  getNodeBlocks,
  getCampaignNodes,
  replaceNodeBlocks,
} from './node.controller';

const router = Router();

router.use(authenticate);

router.get('/campaign/:campaignId', isCampaignMember, getCampaignNodes);
router.post('/campaign/:campaignId', isGM, createCampaignNode);
router.post('/campaign/:campaignId/wiki', isGM, createCampaignWikiNode);
router.post('/campaign/:campaignId/relations', isGM, createNodeRelation);
router.post('/campaign/:campaignId/characters/:characterId/attach', isGM, attachCharacterToNode);
router.get('/campaign/:campaignId/:nodeId/blocks', isCampaignMember, getNodeBlocks);
router.put('/campaign/:campaignId/:nodeId/blocks', isGM, replaceNodeBlocks);

export default router;
