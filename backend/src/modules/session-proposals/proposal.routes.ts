import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember, isGM } from '../../middlewares/permission.middleware';
import {
  cancelSessionProposal,
  decideSessionProposal,
  voteSessionProposal,
} from './proposal.controller';

const router = Router();

router.use(authenticate);

router.post('/:proposalId/votes', isCampaignMember, voteSessionProposal);
router.patch('/:proposalId/decide', isGM, decideSessionProposal);
router.patch('/:proposalId/cancel', isGM, cancelSessionProposal);

export default router;
