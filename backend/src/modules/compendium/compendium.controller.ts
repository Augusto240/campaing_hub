import { Request, Response, NextFunction } from 'express';
import { CompendiumService } from './compendium.service';

const compendiumService = new CompendiumService();

export class CompendiumController {
  // ==== SPELLS ====

  async listSpells(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const { level, school, class: charClass, ritual, concentration, search } = req.query;

      const spells = await compendiumService.listSpells({
        systemId,
        level: level ? parseInt(level as string, 10) : undefined,
        school: school as any,
        class: charClass as string,
        ritual: ritual ? ritual === 'true' : undefined,
        concentration: concentration ? concentration === 'true' : undefined,
        search: search as string,
      });

      res.json({
        success: true,
        data: spells,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSpell(req: Request, res: Response, next: NextFunction) {
    try {
      const { spellId } = req.params;
      const spell = await compendiumService.getSpell(spellId);

      res.json({
        success: true,
        data: spell,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSpell(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const userId = (req as any).user?.id;

      const spell = await compendiumService.createSpell({
        ...req.body,
        systemId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: spell,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSpell(req: Request, res: Response, next: NextFunction) {
    try {
      const { spellId } = req.params;
      const spell = await compendiumService.updateSpell(spellId, req.body);

      res.json({
        success: true,
        data: spell,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSpell(req: Request, res: Response, next: NextFunction) {
    try {
      const { spellId } = req.params;
      await compendiumService.deleteSpell(spellId);

      res.json({
        success: true,
        message: 'Spell deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==== CLASSES ====

  async listClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const { search } = req.query;

      const classes = await compendiumService.listClasses(systemId, search as string);

      res.json({
        success: true,
        data: classes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const charClass = await compendiumService.getClass(classId);

      res.json({
        success: true,
        data: charClass,
      });
    } catch (error) {
      next(error);
    }
  }

  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const userId = (req as any).user?.id;

      const charClass = await compendiumService.createClass({
        ...req.body,
        systemId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: charClass,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==== ANCESTRIES ====

  async listAncestries(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const { search } = req.query;

      const ancestries = await compendiumService.listAncestries(systemId, search as string);

      res.json({
        success: true,
        data: ancestries,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAncestry(req: Request, res: Response, next: NextFunction) {
    try {
      const { ancestryId } = req.params;
      const ancestry = await compendiumService.getAncestry(ancestryId);

      res.json({
        success: true,
        data: ancestry,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAncestry(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const userId = (req as any).user?.id;

      const ancestry = await compendiumService.createAncestry({
        ...req.body,
        systemId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: ancestry,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==== CONDITIONS ====

  async listConditions(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const conditions = await compendiumService.listConditions(systemId);

      res.json({
        success: true,
        data: conditions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCondition(req: Request, res: Response, next: NextFunction) {
    try {
      const { conditionId } = req.params;
      const condition = await compendiumService.getCondition(conditionId);

      res.json({
        success: true,
        data: condition,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCondition(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;

      const condition = await compendiumService.createCondition({
        ...req.body,
        systemId,
      });

      res.status(201).json({
        success: true,
        data: condition,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==== BACKGROUNDS ====

  async listBackgrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const { search } = req.query;

      const backgrounds = await compendiumService.listBackgrounds(systemId, search as string);

      res.json({
        success: true,
        data: backgrounds,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBackground(req: Request, res: Response, next: NextFunction) {
    try {
      const { backgroundId } = req.params;
      const background = await compendiumService.getBackground(backgroundId);

      res.json({
        success: true,
        data: background,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBackground(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const userId = (req as any).user?.id;

      const background = await compendiumService.createBackground({
        ...req.body,
        systemId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: background,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==== FEATS ====

  async listFeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const { search } = req.query;

      const feats = await compendiumService.listFeats(systemId, search as string);

      res.json({
        success: true,
        data: feats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeat(req: Request, res: Response, next: NextFunction) {
    try {
      const { featId } = req.params;
      const feat = await compendiumService.getFeat(featId);

      res.json({
        success: true,
        data: feat,
      });
    } catch (error) {
      next(error);
    }
  }

  async createFeat(req: Request, res: Response, next: NextFunction) {
    try {
      const { systemId } = req.params;
      const userId = (req as any).user?.id;

      const feat = await compendiumService.createFeat({
        ...req.body,
        systemId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: feat,
      });
    } catch (error) {
      next(error);
    }
  }
}
