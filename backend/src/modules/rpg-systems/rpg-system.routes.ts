import { Router } from 'express';
import { listRpgSystems } from './rpg-system.controller';

const router = Router();

router.get('/', listRpgSystems);

export default router;

