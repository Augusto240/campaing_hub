import { Response, NextFunction } from 'express';
import { CharacterService } from './character.service';
import { asyncHandler, AppError } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { validate } from '../../utils/validation';
import {
  campaignIdParamsSchema,
  characterIdParamsSchema,
  createCharacterSchema,
  updateCharacterSchema,
} from './character.validation';

const characterService = new CharacterService();

export const createCharacter = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, class: charClass, campaignId } = validate(createCharacterSchema, req.body);

    const character = await characterService.createCharacter(
      req.user!.id,
      campaignId,
      name,
      charClass
    );

    res.status(201).json(success(character, 'Character created successfully'));
  }
);

export const getCharacters = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const characters = await characterService.getCharactersByCampaign(campaignId);

    res.json(success(characters, 'Characters retrieved successfully'));
  }
);

export const getCharacterById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);

    const character = await characterService.getCharacterById(characterId);

    res.json(success(character, 'Character retrieved successfully'));
  }
);

export const updateCharacter = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);
    const { name, class: charClass, level, xp } = validate(updateCharacterSchema, req.body);

    const character = await characterService.updateCharacter(characterId, {
      name,
      class: charClass,
      level,
      xp,
    });

    res.json(success(character, 'Character updated successfully'));
  }
);

export const deleteCharacter = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);

    await characterService.deleteCharacter(characterId);

    res.json(success(null, 'Character deleted successfully'));
  }
);

export const uploadCharacterSheet = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);

    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const character = await characterService.uploadSheet(characterId, req.file.path);

    res.json(success(character, 'Character sheet uploaded successfully'));
  }
);
