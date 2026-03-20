import { Router } from 'express';
import { createLoot, getLoot, updateLoot, deleteLoot, assignLoot } from './loot.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember, isGM } from '../../middlewares/permission.middleware';

const router = Router();

router.use(authenticate);

router.post('/', isGM, createLoot);
router.get('/session/:sessionId', isCampaignMember, getLoot);
router.put('/:lootId', isGM, updateLoot);
router.delete('/:lootId', isGM, deleteLoot);
router.post('/:lootId/assign', isGM, assignLoot);

export default router;
