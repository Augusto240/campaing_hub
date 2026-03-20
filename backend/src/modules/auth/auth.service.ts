import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt, { Algorithm, Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

const DURATION_REGEX = /^(\d+)([smhdw])$/i;
const DURATION_UNITS_IN_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};
const JWT_ALGORITHM: Algorithm = 'HS256';
const MIN_SECRET_LENGTH = 32;

const parseDurationToMs = (duration: string): number => {
  const normalized = duration.trim();
  const numericOnly = Number(normalized);

  if (Number.isFinite(numericOnly) && numericOnly > 0) {
    return numericOnly * 1000;
  }

  const match = normalized.match(DURATION_REGEX);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const [, amountRaw, unitRaw] = match;
  const amount = Number(amountRaw);
  const unit = unitRaw.toLowerCase();
  const unitMs = DURATION_UNITS_IN_MS[unit];

  if (!Number.isFinite(amount) || amount <= 0 || !unitMs) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  return amount * unitMs;
};

export class AuthService {
  private readonly jwtSecret: Secret;
  private readonly jwtRefreshSecret: Secret;
  private readonly jwtExpiresIn: SignOptions['expiresIn'];
  private readonly jwtRefreshExpiresIn: SignOptions['expiresIn'];
  private readonly refreshTokenTtlMs: number;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('[FATAL] JWT_SECRET e JWT_REFRESH_SECRET sao obrigatorios. Veja .env.example');
    }

    if (jwtSecret.length < MIN_SECRET_LENGTH || jwtRefreshSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `[FATAL] JWT_SECRET e JWT_REFRESH_SECRET devem ter no minimo ${MIN_SECRET_LENGTH} caracteres.`
      );
    }

    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
    const jwtRefreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
      '7d') as SignOptions['expiresIn'];

    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.jwtRefreshExpiresIn = jwtRefreshExpiresIn;
    try {
      this.refreshTokenTtlMs = parseDurationToMs(String(jwtRefreshExpiresIn));
    } catch (error) {
      throw new Error(
        `[FATAL] JWT_REFRESH_EXPIRES_IN invalido: "${String(jwtRefreshExpiresIn)}".`
      );
    }
  }

  async register(name: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email, user.role);

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email, user.role);

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const tokenHash = this.hashRefreshToken(token);
      const decoded = jwt.verify(token, this.jwtRefreshSecret, {
        algorithms: [JWT_ALGORITHM],
      }) as TokenPayload;
      const now = new Date();

      return prisma.$transaction(async (tx) => {
        const storedToken = await tx.refreshToken.findUnique({
          where: { token: tokenHash },
        });

        if (!storedToken) {
          throw new AppError(401, 'Invalid refresh token');
        }

        if (storedToken.revoked) {
          await tx.refreshToken.updateMany({
            where: {
              userId: storedToken.userId,
              revoked: false,
            },
            data: {
              revoked: true,
            },
          });
          throw new AppError(401, 'Invalid refresh token');
        }

        if (storedToken.expiresAt < now) {
          await tx.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
          });
          throw new AppError(401, 'Refresh token expired');
        }

        if (storedToken.userId !== decoded.id) {
          throw new AppError(401, 'Invalid refresh token');
        }

        const user = await tx.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) {
          throw new AppError(401, 'User not found');
        }

        await tx.refreshToken.update({
          where: { id: storedToken.id },
          data: {
            revoked: true,
          },
        });

        const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
          user.id,
          user.email,
          user.role
        );

        await tx.refreshToken.create({
          data: {
            token: this.hashRefreshToken(newRefreshToken),
            userId: user.id,
            expiresAt: this.calculateRefreshExpiryDate(),
            revoked: false,
          },
        });

        return {
          accessToken,
          refreshToken: newRefreshToken,
        };
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(token: string) {
    const tokenHash = this.hashRefreshToken(token);
    await prisma.refreshToken.updateMany({
      where: { token: tokenHash, revoked: false },
      data: { revoked: true },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  private generateTokens(id: string, email: string, role: string) {
    const payload = { id, email, role };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      algorithm: JWT_ALGORITHM,
    });
    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
      algorithm: JWT_ALGORITHM,
    });

    return { accessToken, refreshToken };
  }

  private calculateRefreshExpiryDate() {
    return new Date(Date.now() + this.refreshTokenTtlMs);
  }

  private async saveRefreshToken(userId: string, token: string) {
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });

      await tx.refreshToken.create({
        data: {
          token: this.hashRefreshToken(token),
          userId,
          expiresAt: this.calculateRefreshExpiryDate(),
          revoked: false,
        },
      });
    });
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
