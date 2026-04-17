import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { isCampaignMember, isGM } from '../../middlewares/permission.middleware';
import {
  addCombatant,
  advanceCombatTurn,
  getCombatEncounter,
  removeCombatant,
  reorderCombatants,
  updateCombatant,
} from './combat.controller';

const router = Router();

router.use(authenticate);

router.get('/:encounterId', isCampaignMember, getCombatEncounter);
router.patch('/:encounterId/next-turn', isGM, advanceCombatTurn);
router.patch('/:encounterId/reorder', isGM, reorderCombatants);
router.patch('/:encounterId/combatants/:combatantId', isGM, updateCombatant);
router.post('/:encounterId/combatants', isGM, addCombatant);
router.delete('/:encounterId/combatants/:combatantId', isGM, removeCombatant);

export default router;
