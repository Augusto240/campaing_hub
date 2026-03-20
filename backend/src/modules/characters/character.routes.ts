import { Router } from 'express';
import {
  createCharacter,
  getCharacters,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
  uploadCharacterSheet,
} from './character.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  canManageCharacter,
  canViewCharacter,
  isCampaignMember,
} from '../../middlewares/permission.middleware';
import { upload } from '../../config/upload';

const router = Router();

router.use(authenticate);

router.post('/', createCharacter);
router.get('/campaign/:campaignId', isCampaignMember, getCharacters);
router.get('/:characterId', canViewCharacter, getCharacterById);
router.put('/:characterId', canManageCharacter, updateCharacter);
router.delete('/:characterId', canManageCharacter, deleteCharacter);
router.post('/:characterId/sheet', canManageCharacter, upload.single('sheet'), uploadCharacterSheet);

export default router;
