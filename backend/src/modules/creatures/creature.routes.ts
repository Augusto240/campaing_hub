import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  createCreature,
  getCreatureById,
  listCreatures,
  updateCreature,
} from './creature.controller';

const router = Router();

router.use(authenticate);

router.get('/', listCreatures);
router.get('/:creatureId', getCreatureById);
router.post('/', createCreature);
router.put('/:creatureId', updateCreature);

export default router;
