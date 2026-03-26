import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new SearchController();

// All routes require authentication
router.use(authenticate);

// Full-text search across all content types
router.get('/campaign/:campaignId', controller.search.bind(controller));

// Quick search for wiki pages (autocomplete)
router.get('/campaign/:campaignId/wiki', controller.searchWikiPages.bind(controller));

// Get recent pages
router.get('/campaign/:campaignId/recent', controller.getRecentPages.bind(controller));

export default router;
