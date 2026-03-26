import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rate-limit.middleware';

const router = Router();

// Auth endpoints with stricter rate limiting (brute force protection)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout); // No auth required - uses refresh token from body
router.get('/profile', authenticate, getProfile);

export default router;
