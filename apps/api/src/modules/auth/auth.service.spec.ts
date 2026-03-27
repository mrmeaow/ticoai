import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: Partial<UsersRepository>;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;

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

  beforeEach(() => {
    usersRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };

    jwtService = {
      sign: vi.fn(),
      signAsync: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    configService = {
      get: vi.fn(),
    };

    authService = new AuthService(
      usersRepository as UsersRepository,
      jwtService as JwtService,
      configService as ConfigService,
    );
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      (usersRepository.findByEmail as vi.Mock).mockResolvedValue(null);
      (usersRepository.create as vi.Mock).mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });
      (jwtService.sign as vi.Mock).mockReturnValue('mock-token');
      (configService.get as vi.Mock).mockReturnValue('test-secret');

      const result = await authService.register(registerDto.email, registerDto.password, registerDto.name);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw if email already exists', async () => {
      (usersRepository.findByEmail as vi.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.register('test@example.com', 'password123', 'Test'),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash on valid credentials', async () => {
      const userWithPassword = { ...mockUser, passwordHash: await bcrypt.hash('password123', 10) };
      
      (usersRepository.findByEmail as vi.Mock).mockResolvedValue(userWithPassword);

      const result = await authService.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result?.passwordHash).toBeUndefined();
    });

    it('should return null on invalid password', async () => {
      (usersRepository.findByEmail as vi.Mock).mockResolvedValue(mockUser);

      const result = await authService.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      (usersRepository.findByEmail as vi.Mock).mockResolvedValue(null);

      const result = await authService.validateUser('notfound@example.com', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens for valid user', async () => {
      (jwtService.signAsync as vi.Mock).mockResolvedValue('mock-token');
      (configService.get as vi.Mock).mockReturnValue('test-secret');

      const result = await authService.login(mockUser as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
