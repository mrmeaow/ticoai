import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;
  let redisService: Partial<RedisService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    isActive: true,
    roles: [{ id: '1', name: 'USER' }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      validatePassword: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    redisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      (usersService.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });
      (jwtService.signAsync as jest.Mock).mockResolvedValue('mock-token');
      (configService.get as jest.Mock).mockReturnValue('test-secret');
      (redisService.set as jest.Mock).mockResolvedValue('OK');

      const result = await authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );

      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw if email already exists', async () => {
      (usersService.create as jest.Mock).mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(
        authService.register('test@example.com', 'password123', 'Test'),
      ).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash on valid credentials', async () => {
      const userWithPassword = { ...mockUser };

      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        userWithPassword,
      );
      (usersService.validatePassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
    });

    it('should throw on invalid password', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (usersService.validatePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw if user not found', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        authService.validateUser('notfound@example.com', 'password123'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('login', () => {
    it('should return tokens for valid user', async () => {
      (jwtService.signAsync as jest.Mock).mockResolvedValue('mock-token');
      (configService.get as jest.Mock).mockReturnValue('test-secret');
      (redisService.set as jest.Mock).mockResolvedValue('OK');

      const result = await authService.login(mockUser as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const decodedToken = {
        sub: 'test-user-id',
        email: 'test@example.com',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(decodedToken);
      (redisService.get as jest.Mock).mockResolvedValue('valid-refresh-token');
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('new-access-token');
      (jwtService.signAsync as jest.Mock).mockResolvedValue(
        'new-refresh-token',
      );
      (configService.get as jest.Mock).mockReturnValue('test-secret');
      (redisService.set as jest.Mock).mockResolvedValue('OK');

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(redisService.get).toHaveBeenCalledWith('refresh:test-user-id');
      expect(usersService.findById).toHaveBeenCalledWith(decodedToken.sub);
    });

    it('should throw on expired token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('jwt expired'),
      );

      await expect(authService.refreshToken('expired-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw on token mismatch with Redis', async () => {
      const decodedToken = {
        sub: 'test-user-id',
        email: 'test@example.com',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(decodedToken);
      (redisService.get as jest.Mock).mockResolvedValue('different-token');

      await expect(
        authService.refreshToken('mismatched-token'),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw on user not found during refresh', async () => {
      const decodedToken = {
        sub: 'non-existent-user-id',
        email: 'test@example.com',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(decodedToken);
      (redisService.get as jest.Mock).mockResolvedValue('valid-refresh-token');
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken('valid-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (redisService.del as jest.Mock).mockResolvedValue(1);

      await authService.logout('test-user-id');

      expect(redisService.del).toHaveBeenCalledWith('refresh:test-user-id');
    });
  });

  describe('parseTtlToSeconds', () => {
    it('should parse seconds (s)', () => {
      expect((authService as any).parseTtlToSeconds('30s')).toBe(30);
    });

    it('should parse minutes (m)', () => {
      expect((authService as any).parseTtlToSeconds('5m')).toBe(300);
    });

    it('should parse hours (h)', () => {
      expect((authService as any).parseTtlToSeconds('2h')).toBe(7200);
    });

    it('should parse days (d)', () => {
      expect((authService as any).parseTtlToSeconds('7d')).toBe(604800);
    });

    it('should return default for invalid format', () => {
      expect((authService as any).parseTtlToSeconds('invalid')).toBe(604800);
    });

    it('should return default for unsupported unit', () => {
      expect((authService as any).parseTtlToSeconds('30w')).toBe(604800);
    });
  });
});
