import express from 'express';
import cors from 'cors';
import { logger } from './config/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import { createSecurityMiddleware } from './middlewares/security.middleware';
import { standardLimiter } from './middlewares/rate-limit.middleware';
import authRoutes from './modules/auth/auth.routes';
import campaignRoutes from './modules/campaigns/campaign.routes';
import characterRoutes from './modules/characters/character.routes';
import sessionRoutes from './modules/sessions/session.routes';
import lootRoutes from './modules/loot/loot.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import rpgSystemRoutes from './modules/rpg-systems/rpg-system.routes';
import diceRoutes from './modules/dice/dice.routes';
import wikiRoutes from './modules/wiki/wiki.routes';
import combatRoutes from './modules/combat/combat.routes';
import creatureRoutes from './modules/creatures/creature.routes';
import sessionProposalRoutes from './modules/session-proposals/proposal.routes';
import compendiumRoutes from './modules/compendium/compendium.routes';
import knowledgeGraphRoutes from './modules/knowledge-graph/knowledge-graph.routes';
import coreRoutes from './modules/core/core.routes';
import {
  canAccessMetrics,
  metricsMiddleware,
  metricsRegistry,
  refreshMetricsSnapshot,
} from './config/metrics';

export const createApp = () => {
  const app = express();

  // Security headers (helmet)
  app.use(createSecurityMiddleware());

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting (applied to API routes)
  app.use('/api', standardLimiter);

  app.use(metricsMiddleware);
  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      logger.info(
        {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          ms: Date.now() - startedAt,
        },
        '[http] request completed'
      );
    });

    next();
  });

  app.use('/uploads', express.static('uploads'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  app.get('/metrics', async (req, res, next) => {
    try {
      if (!canAccessMetrics(req)) {
        res.status(403).json({
          status: 'error',
          message: 'Forbidden',
          code: 'FORBIDDEN',
        });
        return;
      }

      await refreshMetricsSnapshot();
      res.set('Content-Type', metricsRegistry.contentType);
      res.end(await metricsRegistry.metrics());
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/characters', characterRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/loot', lootRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/rpg-systems', rpgSystemRoutes);
  app.use('/api/dice', diceRoutes);
  app.use('/api/wiki', wikiRoutes);
  app.use('/api/combat', combatRoutes);
  app.use('/api/creatures', creatureRoutes);
  app.use('/api/session-proposals', sessionProposalRoutes);
  app.use('/api/compendium', compendiumRoutes);
  app.use('/api/knowledge-graph', knowledgeGraphRoutes);
  app.use('/api/core', coreRoutes);

  app.use(errorMiddleware);

  app.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  return app;
};
