import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Rate Limiting Configuration
 * Protects API endpoints from abuse while allowing legitimate traffic.
 */

// Standard limit for authenticated routes
export const standardLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    status: 'error',
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (req, res, _next, options) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
      },
      '[rate-limit] request blocked'
    );
    res.status(options.statusCode).json(options.message);
  },
});

// Strict limit for auth endpoints (login, register)
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        email: req.body?.email,
      },
      '[rate-limit] auth attempt blocked'
    );
    res.status(options.statusCode).json(options.message);
  },
});

// Dice rolling limit (prevent spam in realtime)
export const diceLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // 20 rolls per 10 seconds
  message: {
    status: 'error',
    message: 'Rolling too fast! Slow down, adventurer.',
    code: 'DICE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
});

// Create Redis-backed store for distributed rate limiting (when Redis is available)
export const createRedisRateLimitStore = () => {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      logger.info('[rate-limit] using in-memory store (Redis not ready)');
      return undefined;
    }

    return new RedisStore({
      // @ts-expect-error - ioredis typing mismatch with rate-limit-redis
      sendCommand: async (command: string, ...args: string[]) => redis.call(command, ...args),
      prefix: 'rl:',
    });
  } catch (err) {
    logger.warn({ err }, '[rate-limit] failed to create Redis store, using in-memory');
    return undefined;
  }
};

// Production-ready limiter with Redis store
export const createProductionLimiter = (options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}): RateLimitRequestHandler => {
  const store = createRedisRateLimitStore();

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    ...(store ? { store } : {}),
    message: {
      status: 'error',
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const prefix = options.keyPrefix || 'api';
      const userId = (req as any).user?.id;
      return `${prefix}:${userId || req.ip || 'unknown'}`;
    },
  });
};
