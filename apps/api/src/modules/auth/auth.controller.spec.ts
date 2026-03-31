import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue(mockTokens),
      login: jest.fn().mockResolvedValue(mockTokens),
      validateUser: jest
        .fn()
        .mockResolvedValue({
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
        }),
      refreshToken: jest.fn().mockResolvedValue(mockTokens),
      logout: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/auth/register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      expect(result).toEqual(mockTokens);
    });

    it('should handle validation errors - invalid email', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controller = module.get<AuthController>(AuthController);

      try {
        await controller.register(invalidDto);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle validation errors - weak password', async () => {
      const weakPasswordDto = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controller = module.get<AuthController>(AuthController);

      try {
        await controller.register(weakPasswordDto);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle duplicate email error', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should handle missing required fields', async () => {
      const incompleteDto = { email: 'test@example.com' };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controller = module.get<AuthController>(AuthController);

      try {
        await controller.register(incompleteDto);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    it('should login successfully', async () => {
      const result = await controller.login(loginDto, mockResponse as any);

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: mockTokens.accessToken });
    });

    it('should handle invalid credentials', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(
        controller.login(loginDto, mockResponse as any),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle inactive user', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(
        new Error('User account is deactivated'),
      );

      await expect(
        controller.login(loginDto, mockResponse as any),
      ).rejects.toThrow('User account is deactivated');
    });

    it('should handle login with missing fields', async () => {
      const incompleteDto = { email: 'test@example.com' };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controller = module.get<AuthController>(AuthController);

      try {
        await controller.login(incompleteDto, mockResponse as any);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    const mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      req: { cookies: {} },
    };

    it('should refresh token successfully with body token', async () => {
      const refreshDto = { refreshToken: 'mock-refresh-token' };

      const result = await controller.refresh(refreshDto, mockResponse as any);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'mock-refresh-token',
      );
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: mockTokens.accessToken });
    });

    it('should refresh token successfully with cookie token', async () => {
      const mockResponseWithCookie = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        req: { cookies: { refreshToken: 'cookie-refresh-token' } },
      };

      const result = await controller.refresh(
        {},
        mockResponseWithCookie as any,
      );

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'cookie-refresh-token',
      );
      expect(result).toEqual({ accessToken: mockTokens.accessToken });
    });

    it('should handle invalid token', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Invalid refresh token'),
      );

      const refreshDto = { refreshToken: 'invalid-token' };

      await expect(
        controller.refresh(refreshDto, mockResponse as any),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should handle no token provided', async () => {
      const result = await controller.refresh({}, mockResponse as any);

      expect(result).toEqual({ error: 'No refresh token provided' });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should handle expired token', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Token expired'),
      );

      const refreshDto = { refreshToken: 'expired-token' };

      await expect(
        controller.refresh(refreshDto, mockResponse as any),
      ).rejects.toThrow('Token expired');
    });
  });

  describe('POST /api/auth/logout', () => {
    const mockResponse = {
      clearCookie: jest.fn(),
    };

    it('should logout successfully', async () => {
      const result = await controller.logout('user-id', mockResponse as any);

      expect(authService.logout).toHaveBeenCalledWith('user-id');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout service error', async () => {
      (authService.logout as jest.Mock).mockRejectedValue(
        new Error('Logout failed'),
      );

      await expect(
        controller.logout('user-id', mockResponse as any),
      ).rejects.toThrow('Logout failed');
    });
  });
});
