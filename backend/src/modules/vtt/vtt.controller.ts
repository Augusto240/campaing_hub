import { Request, Response, NextFunction } from 'express';
import { VttService } from './vtt.service';

const vttService = new VttService();

export class VttController {
  // === MAP ENDPOINTS ===

  async getMaps(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const maps = await vttService.getMapsByCampaign(campaignId);

      res.json({
        success: true,
        data: maps,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { mapId } = req.params;
      const map = await vttService.getMap(mapId);

      res.json({
        success: true,
        data: map,
      });
    } catch (error) {
      next(error);
    }
  }

  async createMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const { name, imageUrl, width, height, gridType, gridSize } = req.body;

      const map = await vttService.createMap({
        campaignId,
        name,
        imageUrl,
        width,
        height,
        gridType,
        gridSize,
      });

      res.status(201).json({
        success: true,
        data: map,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { mapId } = req.params;
      const map = await vttService.updateMap({
        mapId,
        ...req.body,
      });

      res.json({
        success: true,
        data: map,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { mapId } = req.params;
      await vttService.deleteMap(mapId);

      res.json({
        success: true,
        message: 'Map deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async setActiveMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId, mapId } = req.params;
      const map = await vttService.setActiveMap(campaignId, mapId);

      res.json({
        success: true,
        data: map,
      });
    } catch (error) {
      next(error);
    }
  }

  // === TOKEN ENDPOINTS ===

  async createToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { mapId } = req.params;
      const token = await vttService.createToken({
        mapId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        data: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params;
      const token = await vttService.updateToken({
        tokenId,
        ...req.body,
      });

      res.json({
        success: true,
        data: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async moveToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params;
      const { x, y, rotation } = req.body;

      const token = await vttService.moveToken({
        tokenId,
        x,
        y,
        rotation,
      });

      res.json({
        success: true,
        data: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params;
      await vttService.deleteToken(tokenId);

      res.json({
        success: true,
        message: 'Token deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async batchMoveTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { moves } = req.body;
      await vttService.batchMoveTokens(moves);

      res.json({
        success: true,
        message: 'Tokens moved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // === FOG OF WAR ===

  async revealFog(req: Request, res: Response, next: NextFunction) {
    try {
      const { mapId } = req.params;
      const { areas } = req.body;

      const map = await vttService.revealFog(mapId, areas);

      res.json({
        success: true,
        data: map,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetFog(req: Request, res: Response, next: NextFunction) {
    try {
      const { mapId } = req.params;
      const map = await vttService.resetFog(mapId);

      res.json({
        success: true,
        data: map,
      });
    } catch (error) {
      next(error);
    }
  }
}
