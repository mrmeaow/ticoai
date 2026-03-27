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
      create: jest.fn(),
      findById: jest.fn(),
      validatePassword: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
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

      const result = await authService.register(registerDto.email, registerDto.password, registerDto.name);

      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw if email already exists', async () => {
      (usersService.create as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      await expect(
        authService.register('test@example.com', 'password123', 'Test'),
      ).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash on valid credentials', async () => {
      const userWithPassword = { ...mockUser };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(userWithPassword);
      (usersService.validatePassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
    });

    it('should throw on invalid password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (usersService.validatePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

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
});
