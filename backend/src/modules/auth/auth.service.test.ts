import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/error-handler';

const mockTx = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
};

const mockPrisma = {
  user: mockTx.user,
  refreshToken: mockTx.refreshToken,
  $transaction: jest.fn(),
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

const LONG_SECRET = '12345678901234567890123456789012';
const LONG_REFRESH_SECRET = 'abcdefabcdefabcdefabcdefabcdefab';

describe('AuthService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx)
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw a fatal error if JWT_SECRET is missing', async () => {
    process.env.JWT_SECRET = '';
    process.env.JWT_REFRESH_SECRET = LONG_REFRESH_SECRET;
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const { AuthService } = await import('./auth.service');

    expect(() => new AuthService()).toThrow('[FATAL]');
  });

  it('should throw a fatal error when JWT secrets are too short', async () => {
    process.env.JWT_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'also-short';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const { AuthService } = await import('./auth.service');

    expect(() => new AuthService()).toThrow('[FATAL]');
  });

  it('should rotate refresh token and persist hashed token', async () => {
    process.env.JWT_SECRET = LONG_SECRET;
    process.env.JWT_REFRESH_SECRET = LONG_REFRESH_SECRET;
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const { AuthService } = await import('./auth.service');
    const service = new AuthService();

    const rawRefreshToken = jwt.sign(
      { id: 'user-1', email: 'user@test.com', role: 'USER' },
      LONG_REFRESH_SECRET
    );
    const hashedRefreshToken = createHash('sha256').update(rawRefreshToken).digest('hex');

    mockTx.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      token: hashedRefreshToken,
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    mockTx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'USER',
    });
    mockTx.refreshToken.update.mockResolvedValue({
      id: 'rt-1',
      revoked: true,
    });
    mockTx.refreshToken.create.mockResolvedValue({
      id: 'rt-2',
    });

    const result = await service.refreshToken(rawRefreshToken);

    expect(mockTx.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { token: hashedRefreshToken },
    });
    expect(mockTx.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: {
        revoked: true,
      },
    });
    expect(mockTx.refreshToken.create).toHaveBeenCalled();

    const createCall = mockTx.refreshToken.create.mock.calls[0][0];
    expect(createCall.data.token).toHaveLength(64);
    expect(createCall.data.token).not.toContain('.');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).toContain('.');
  });

  it('should reject revoked refresh token and revoke active session chain', async () => {
    process.env.JWT_SECRET = LONG_SECRET;
    process.env.JWT_REFRESH_SECRET = LONG_REFRESH_SECRET;
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const { AuthService } = await import('./auth.service');
    const service = new AuthService();

    const rawRefreshToken = jwt.sign(
      { id: 'user-2', email: 'user2@test.com', role: 'USER' },
      LONG_REFRESH_SECRET
    );
    const hashedRefreshToken = createHash('sha256').update(rawRefreshToken).digest('hex');

    mockTx.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-3',
      token: hashedRefreshToken,
      userId: 'user-2',
      revoked: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    mockTx.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.refreshToken(rawRefreshToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid refresh token',
    } as AppError);

    expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-2',
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
  });
});
