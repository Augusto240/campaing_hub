import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  generateSessionReport,
} from './session.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { isGM, isCampaignMember } from '../../middlewares/permission.middleware';

const router = Router();

router.use(authenticate);

router.post('/', isGM, createSession);
router.get('/campaign/:campaignId', isCampaignMember, getSessions);
router.get('/:sessionId', isCampaignMember, getSessionById);
router.put('/:sessionId', isGM, updateSession);
router.delete('/:sessionId', isGM, deleteSession);
router.get('/:sessionId/report', isCampaignMember, generateSessionReport);

export default router;
