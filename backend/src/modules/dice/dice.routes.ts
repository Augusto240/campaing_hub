import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember } from '../../middlewares/permission.middleware';
import { diceLimiter } from '../../middlewares/rate-limit.middleware';
import { createDiceRoll, getCampaignDiceRolls } from './dice.controller';

const router = Router();

router.use(authenticate);

// Dice rolls with spam protection
router.post('/roll', diceLimiter, isCampaignMember, createDiceRoll);
router.get('/campaign/:campaignId', isCampaignMember, getCampaignDiceRolls);

export default router;

