import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../modules/roles/roles.service';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { PermissionsKey } from '../decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Partial<Reflector>;
  let rolesService: Partial<RolesService>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    rolesService = {
      getUserPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no permissions required', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when empty permissions array', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'tickets:read',
      ]);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: null,
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should return true when user has required permission', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'tickets:read',
      ]);
      (rolesService.getUserPermissions as jest.Mock).mockResolvedValue([
        'tickets:read',
        'tickets:write',
      ]);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'user-id' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rolesService.getUserPermissions).toHaveBeenCalledWith('user-id');
    });

    it('should return true when user has one of multiple required permissions', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'tickets:read',
        'tickets:delete',
      ]);
      (rolesService.getUserPermissions as jest.Mock).mockResolvedValue([
        'tickets:read',
      ]);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'user-id' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user lacks permissions', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'tickets:delete',
        'admin:users',
      ]);
      (rolesService.getUserPermissions as jest.Mock).mockResolvedValue([
        'tickets:read',
      ]);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'user-id' },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing required permissions: tickets:delete, admin:users',
      );
    });
  });
});
