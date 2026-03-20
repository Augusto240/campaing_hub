import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { RpgSystemService } from './rpg-system.service';

const rpgSystemService = new RpgSystemService();

/**
 * GET /api/rpg-systems
 * Lista sistemas RPG suportados para criacao de campanhas.
 */
export const listRpgSystems = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const systems = await rpgSystemService.getSystems();
    res.json(success(systems, 'RPG systems retrieved successfully'));
  }
);

