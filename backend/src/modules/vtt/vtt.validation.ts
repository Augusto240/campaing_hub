import { z } from 'zod';

export const createMapSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    imageUrl: z.string().url(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    gridType: z.enum(['SQUARE', 'HEX_HORIZONTAL', 'HEX_VERTICAL', 'NONE']).optional(),
    gridSize: z.number().int().positive().optional(),
  }),
});

export const updateMapSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    imageUrl: z.string().url().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    gridType: z.enum(['SQUARE', 'HEX_HORIZONTAL', 'HEX_VERTICAL', 'NONE']).optional(),
    gridSize: z.number().int().positive().optional(),
    gridColor: z.string().optional(),
    gridOpacity: z.number().min(0).max(1).optional(),
    fogOfWar: z.any().optional(),
    walls: z.any().optional(),
    lights: z.any().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createTokenSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    imageUrl: z.string().url().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    characterId: z.string().uuid().optional(),
    creatureId: z.string().uuid().optional(),
    controlledBy: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTokenSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    imageUrl: z.string().url().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    rotation: z.number().optional(),
    isVisible: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    layer: z.string().optional(),
    conditions: z.array(z.string()).optional(),
    hp: z.number().int().optional(),
    maxHp: z.number().int().optional(),
    aura: z.any().optional(),
    vision: z.any().optional(),
    controlledBy: z.array(z.string().uuid()).optional(),
  }),
});

export const moveTokenSchema = z.object({
  body: z.object({
    x: z.number(),
    y: z.number(),
    rotation: z.number().optional(),
  }),
});

export const batchMoveTokensSchema = z.object({
  body: z.object({
    moves: z.array(
      z.object({
        tokenId: z.string().uuid(),
        x: z.number(),
        y: z.number(),
        rotation: z.number().optional(),
      })
    ),
  }),
});

export const revealFogSchema = z.object({
  body: z.object({
    areas: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        radius: z.number().positive(),
      })
    ),
  }),
});
