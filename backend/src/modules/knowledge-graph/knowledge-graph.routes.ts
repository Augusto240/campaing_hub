import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember } from '../../middlewares/permission.middleware';
import { getCampaignKnowledgeGraph } from './knowledge-graph.controller';

const router = Router();

router.use(authenticate);

router.get('/campaign/:campaignId', isCampaignMember, getCampaignKnowledgeGraph);

export default router;
