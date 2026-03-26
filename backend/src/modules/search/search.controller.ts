import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';

const searchService = new SearchService();

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const { q, types, limit, offset } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required',
        });
      }

      const results = await searchService.fullTextSearch({
        campaignId,
        query: q,
        types: types ? (types as string).split(',') as any : undefined,
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchWikiPages(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required',
        });
      }

      const results = await searchService.searchWikiPages(campaignId, q);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentPages(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const { limit } = req.query;

      const results = await searchService.getRecentPages(
        campaignId,
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}
