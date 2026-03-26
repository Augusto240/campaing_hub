import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { disconnectRedis } from './config/redis';
import { setupSocket } from './config/socket';
import { startNotificationCleanup } from './modules/notifications/notification.service';
import { RpgSystemService } from './modules/rpg-systems/rpg-system.service';

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
];

const validateEnv = (): void => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateEnv();

const app = createApp();
const httpServer = createServer(app);
setupSocket(httpServer);

const PORT = Number(process.env.PORT || 3000);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    const rpgSystemService = new RpgSystemService();
    await rpgSystemService.ensureDefaultSystems();
    startNotificationCleanup();

    httpServer.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          apiUrl: `http://localhost:${PORT}/api`,
          healthUrl: `http://localhost:${PORT}/health`,
          metricsUrl: `http://localhost:${PORT}/metrics`,
        },
        '[server] listening'
      );
    });
  } catch (error) {
    logger.error({ error }, '[server] failed to start');
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, '[server] shutdown requested');

  try {
    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err?: Error) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    }

    await disconnectRedis();
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '[server] shutdown failed');
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

void startServer();

export default app;
