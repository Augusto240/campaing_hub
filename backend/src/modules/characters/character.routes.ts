import { Router } from 'express';
import {
  castSpell,
  createCharacter,
  getCharacters,
  getCharacterSanityEvents,
  getCharacterSpellCasts,
  getCharacterById,
  sanityCheck,
  updateCharacter,
  updateCharacterResources,
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
router.patch('/:characterId/resources', canManageCharacter, updateCharacterResources);
router.post('/:characterId/sanity-check', canManageCharacter, sanityCheck);
router.get('/:characterId/sanity-events', canViewCharacter, getCharacterSanityEvents);
router.post('/:characterId/spell-cast', canManageCharacter, castSpell);
router.get('/:characterId/spell-casts', canViewCharacter, getCharacterSpellCasts);

export default router;
