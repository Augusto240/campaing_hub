import { Router } from 'express';
import { VttController } from './vtt.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new VttController();

// All routes require authentication
router.use(authenticate);

// Map routes
router.get('/campaign/:campaignId/maps', controller.getMaps.bind(controller));
router.post('/campaign/:campaignId/maps', controller.createMap.bind(controller));
router.get('/maps/:mapId', controller.getMap.bind(controller));
router.put('/maps/:mapId', controller.updateMap.bind(controller));
router.delete('/maps/:mapId', controller.deleteMap.bind(controller));
router.post('/campaign/:campaignId/maps/:mapId/activate', controller.setActiveMap.bind(controller));

// Token routes
router.post('/maps/:mapId/tokens', controller.createToken.bind(controller));
router.put('/tokens/:tokenId', controller.updateToken.bind(controller));
router.post('/tokens/:tokenId/move', controller.moveToken.bind(controller));
router.delete('/tokens/:tokenId', controller.deleteToken.bind(controller));
router.post('/tokens/batch-move', controller.batchMoveTokens.bind(controller));

// Fog of War
router.post('/maps/:mapId/fog/reveal', controller.revealFog.bind(controller));
router.post('/maps/:mapId/fog/reset', controller.resetFog.bind(controller));

export default router;
