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
  sanityCheckSchema,
  spellCastSchema,
  updateResourcesSchema,
  updateCharacterSchema,
} from './character.validation';

const characterService = new CharacterService();

export const createCharacter = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, class: charClass, campaignId, attributes, resources, inventory, notes, imageUrl } =
      validate(createCharacterSchema, req.body);

    const character = await characterService.createCharacter(req.user!.id, {
      campaignId,
      name,
      class: charClass,
      attributes,
      resources,
      inventory,
      notes,
      imageUrl,
    });

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
    const { name, class: charClass, level, xp, attributes, resources, inventory, notes, imageUrl } =
      validate(updateCharacterSchema, req.body);

    const character = await characterService.updateCharacter(characterId, {
      name,
      class: charClass,
      level,
      xp,
      attributes,
      resources,
      inventory,
      notes,
      imageUrl,
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

/**
 * PATCH /api/characters/:characterId/resources
 * Atualiza recursos do personagem (hp/mana/sanity etc).
 */
export const updateCharacterResources = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);
    const { resources } = validate(updateResourcesSchema, req.body);

    const character = await characterService.updateResources(characterId, resources);

    res.json(success(character, 'Character resources updated successfully'));
  }
);

/**
 * POST /api/characters/:characterId/sanity-check
 * Executa teste de sanidade para sistemas com sanidade habilitada.
 */
export const sanityCheck = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);
    const payload = validate(sanityCheckSchema, req.body);

    const result = await characterService.performSanityCheck(characterId, {
      ...payload,
      successLoss: payload.successLoss ?? 0,
      failedLoss: payload.failedLoss ?? 1,
    });

    res.json(success(result, 'Sanity check executed successfully'));
  }
);

/**
 * GET /api/characters/:characterId/sanity-events
 * Lista historico de eventos de sanidade do personagem.
 */
export const getCharacterSanityEvents = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);

    const events = await characterService.getSanityEvents(characterId);

    res.json(success(events, 'Sanity events retrieved successfully'));
  }
);

/**
 * POST /api/characters/:characterId/spell-cast
 * Registra conjuracao de magia para sistemas com mana habilitada.
 */
export const castSpell = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);
    const payload = validate(spellCastSchema, req.body);

    const result = await characterService.castSpell(characterId, {
      ...payload,
      faithCost: payload.faithCost ?? 0,
    });

    res.json(success(result, 'Spell cast registered successfully'));
  }
);

/**
 * GET /api/characters/:characterId/spell-casts
 * Lista historico de magias conjuradas.
 */
export const getCharacterSpellCasts = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { characterId } = validate(characterIdParamsSchema, req.params);

    const spellCasts = await characterService.getSpellCasts(characterId);

    res.json(success(spellCasts, 'Spell casts retrieved successfully'));
  }
);
