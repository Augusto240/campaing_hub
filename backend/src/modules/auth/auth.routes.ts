import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout); // No auth required - uses refresh token from body
router.get('/profile', authenticate, getProfile);

export default router;
