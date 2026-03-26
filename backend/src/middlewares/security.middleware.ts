import helmet from 'helmet';
import { RequestHandler } from 'express';

/**
 * Security Headers Configuration
 * Implements OWASP security best practices via Helmet.
 */

export const securityHeaders: RequestHandler = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Angular
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'wss:', 'ws:'], // Allow WebSocket connections
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Strict Transport Security (HSTS)
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options (IE)
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Remove X-Powered-By
  hidePoweredBy: true,
});

// Lighter CSP for development (allows hot reload, etc.)
export const devSecurityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: false, // Disable CSP in dev for easier debugging
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: false, // No HSTS in dev
});

// Export factory for environment-aware setup
export const createSecurityMiddleware = (): RequestHandler => {
  const isDev = process.env.NODE_ENV !== 'production';
  return isDev ? devSecurityHeaders : securityHeaders;
};
