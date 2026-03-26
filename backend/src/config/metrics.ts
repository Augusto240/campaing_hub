import { Request, Response, NextFunction } from 'express';
import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';
import { prisma } from './database';

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisicoes HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duracao das requisicoes HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const diceRollsTotal = new Counter({
  name: 'dice_rolls_total',
  help: 'Total de rolagens por sistema',
  labelNames: ['system'] as const,
  registers: [metricsRegistry],
});

export const sanityChecksTotal = new Counter({
  name: 'sanity_checks_total',
  help: 'Total de testes de sanidade executados',
  registers: [metricsRegistry],
});

export const activeCampaignsTotal = new Gauge({
  name: 'active_campaigns_total',
  help: 'Quantidade total de campanhas cadastradas',
  registers: [metricsRegistry],
});

const routeLabelFromRequest = (req: Request): string => {
  return req.route?.path
    ? `${req.baseUrl || ''}${req.route.path}`
    : req.originalUrl.split('?')[0] || 'unknown';
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
    const route = routeLabelFromRequest(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
};

export const refreshMetricsSnapshot = async (): Promise<void> => {
  const campaignsCount = await prisma.campaign.count();
  activeCampaignsTotal.set(campaignsCount);
};

const isPrivateAddress = (ip: string): boolean => {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('::ffff:127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith('::ffff:10.') ||
    ip.startsWith('::ffff:192.168.') ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
};

export const canAccessMetrics = (req: Request): boolean => {
  const configuredToken = process.env.METRICS_TOKEN;
  const providedToken = req.header('x-metrics-token');

  if (configuredToken && providedToken === configuredToken) {
    return true;
  }

  return isPrivateAddress(req.ip ?? '');
};
