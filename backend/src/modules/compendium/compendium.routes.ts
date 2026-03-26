import { Router } from 'express';
import { CompendiumController } from './compendium.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new CompendiumController();

// All routes require authentication
router.use(authenticate);

// ==== SPELLS ====
router.get('/systems/:systemId/spells', controller.listSpells.bind(controller));
router.post('/systems/:systemId/spells', controller.createSpell.bind(controller));
router.get('/spells/:spellId', controller.getSpell.bind(controller));
router.put('/spells/:spellId', controller.updateSpell.bind(controller));
router.delete('/spells/:spellId', controller.deleteSpell.bind(controller));

// ==== CLASSES ====
router.get('/systems/:systemId/classes', controller.listClasses.bind(controller));
router.post('/systems/:systemId/classes', controller.createClass.bind(controller));
router.get('/classes/:classId', controller.getClass.bind(controller));

// ==== ANCESTRIES ====
router.get('/systems/:systemId/ancestries', controller.listAncestries.bind(controller));
router.post('/systems/:systemId/ancestries', controller.createAncestry.bind(controller));
router.get('/ancestries/:ancestryId', controller.getAncestry.bind(controller));

// ==== CONDITIONS ====
router.get('/systems/:systemId/conditions', controller.listConditions.bind(controller));
router.post('/systems/:systemId/conditions', controller.createCondition.bind(controller));
router.get('/conditions/:conditionId', controller.getCondition.bind(controller));

// ==== BACKGROUNDS ====
router.get('/systems/:systemId/backgrounds', controller.listBackgrounds.bind(controller));
router.post('/systems/:systemId/backgrounds', controller.createBackground.bind(controller));
router.get('/backgrounds/:backgroundId', controller.getBackground.bind(controller));

// ==== FEATS ====
router.get('/systems/:systemId/feats', controller.listFeats.bind(controller));
router.post('/systems/:systemId/feats', controller.createFeat.bind(controller));
router.get('/feats/:featId', controller.getFeat.bind(controller));

export default router;
