import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember } from '../../middlewares/permission.middleware';
import { createDiceRoll, getCampaignDiceRolls } from './dice.controller';

const router = Router();

router.use(authenticate);

router.post('/roll', isCampaignMember, createDiceRoll);
router.get('/campaign/:campaignId', isCampaignMember, getCampaignDiceRolls);

export default router;

