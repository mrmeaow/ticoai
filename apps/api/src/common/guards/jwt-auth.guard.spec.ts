import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;
  let reflector: Partial<Reflector>;
  let usersService: Partial<UsersService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    roles: [{ id: 'role-id', name: 'USER' }],
  };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    reflector = {
      getAllAndOverride: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: Reflector, useValue: reflector },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
      );
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            query: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access token is missing',
      );
    });

    it('should return true for valid token', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-id',
      });
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (configService.get as jest.Mock).mockReturnValue('test-secret');

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-token',
            },
            query: {},
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-token',
        expect.anything(),
      );
      expect(usersService.findById).toHaveBeenCalledWith('user-id');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer invalid-token',
            },
            query: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-id',
      });
      (usersService.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-token',
            },
            query: {},
          }),
        }),
      } as unknown as ExecutionContext;

      // Note: The guard catches all errors and throws "Invalid or expired token"
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('should extract token from query param for SSE', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-id',
      });
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (configService.get as jest.Mock).mockReturnValue('test-secret');

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            query: { token: 'sse-token' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'sse-token',
        expect.anything(),
      );
    });
  });
});
