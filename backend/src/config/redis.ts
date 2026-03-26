import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

let redisReady = false;

redis.on('connect', () => {
  redisReady = true;
  logger.info({ redisUrl }, '[redis] connected');
});

redis.on('close', () => {
  redisReady = false;
  logger.warn('[redis] connection closed');
});

redis.on('error', (err) => {
  redisReady = false;
  logger.error({ err }, '[redis] connection error');
});

const ensureRedisConnection = async (): Promise<void> => {
  if (redis.status === 'ready' || redis.status === 'connect') {
    return;
  }

  try {
    await redis.connect();
  } catch (err) {
    logger.warn({ err, redisUrl }, '[redis] cache unavailable, using database fallback');
  }
};

export const getCacheValue = async <T>(key: string): Promise<T | null> => {
  await ensureRedisConnection();

  if (!redisReady) {
    return null;
  }

  try {
    const value = await redis.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (err) {
    logger.warn({ err, key }, '[redis] failed to read cache value');
    return null;
  }
};

export const setCacheValue = async <T>(key: string, value: T, ttlSeconds: number): Promise<void> => {
  await ensureRedisConnection();

  if (!redisReady) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, '[redis] failed to write cache value');
  }
};

export const deleteCacheValue = async (key: string): Promise<void> => {
  await ensureRedisConnection();

  if (!redisReady) {
    return;
  }

  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, '[redis] failed to delete cache value');
  }
};

export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  await ensureRedisConnection();

  if (!redisReady) {
    return;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug({ pattern, count: keys.length }, '[redis] invalidated cache keys');
    }
  } catch (err) {
    logger.warn({ err, pattern }, '[redis] failed to delete cache by pattern');
  }
};

/**
 * Cache-aside pattern helper.
 * Tries to get from cache, falls back to fetcher, caches result.
 */
export const withCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = await getCacheValue<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fetcher();
  await setCacheValue(key, result, ttlSeconds);
  return result;
};

// Cache key builders for consistent naming
export const CacheKeys = {
  campaign: (id: string) => `campaign:${id}`,
  campaignStats: (id: string) => `campaign:${id}:stats`,
  userCampaigns: (userId: string) => `user:${userId}:campaigns`,
  character: (id: string) => `character:${id}`,
  campaignCharacters: (campaignId: string) => `campaign:${campaignId}:characters`,
  rpgSystems: () => 'rpg-systems:all',
} as const;

// TTL values (seconds)
export const CacheTTL = {
  CAMPAIGN: 300,         // 5 minutes
  CAMPAIGN_STATS: 60,    // 1 minute (changes frequently)
  USER_CAMPAIGNS: 120,   // 2 minutes
  CHARACTER: 300,        // 5 minutes
  RPG_SYSTEMS: 3600,     // 1 hour (rarely changes)
} as const;

export const disconnectRedis = async (): Promise<void> => {
  if (redis.status === 'end') {
    return;
  }

  try {
    await redis.quit();
  } catch (err) {
    logger.warn({ err }, '[redis] graceful quit failed, forcing disconnect');
    redis.disconnect();
  }
};
