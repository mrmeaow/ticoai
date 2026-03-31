import { Permissions, PermissionsKey } from './permissions.decorator';
import { SetMetadata } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(
    () => (target: any, key: string, descriptor: PropertyDescriptor) =>
      descriptor,
  ),
}));

describe('Permissions Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permissions', () => {
    it('should be defined', () => {
      expect(Permissions).toBeDefined();
    });

    it('should call SetMetadata with PermissionsKey and provided permissions', () => {
      const permissions = ['read', 'write', 'delete'];
      Permissions(...permissions);

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, permissions);
    });

    it('should return a function that can be used as a decorator', () => {
      const decoratorFn = Permissions;
      expect(typeof decoratorFn).toBe('function');
    });

    it('should accept a single permission', () => {
      Permissions('read');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, ['read']);
    });

    it('should accept multiple permissions', () => {
      Permissions('read', 'write');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'read',
        'write',
      ]);
    });

    it('should accept many permissions', () => {
      const permissions = ['read', 'write', 'delete', 'update', 'create'];
      Permissions(...permissions);

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, permissions);
    });
  });

  describe('PermissionsKey', () => {
    it('should export PermissionsKey constant', () => {
      expect(PermissionsKey).toBeDefined();
    });

    it('should have correct key value', () => {
      expect(PermissionsKey).toBe('permissions');
    });
  });

  describe('Decorator application', () => {
    it('should work as a method decorator', () => {
      class TestController {
        @Permissions('read')
        async getData() {
          return 'data';
        }
      }

      expect(TestController.prototype.getData).toBeDefined();
    });

    it('should work as a class decorator', () => {
      @Permissions('read', 'write')
      class TestController {
        async getData() {
          return 'data';
        }
      }

      expect(TestController).toBeDefined();
    });

    it('should set permissions metadata when applied', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      Permissions('read', 'write');

      expect(mockSetMetadata).toHaveBeenCalledWith('permissions', [
        'read',
        'write',
      ]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty permissions array', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      Permissions();

      expect(mockSetMetadata).toHaveBeenCalledWith(PermissionsKey, []);
    });

    it('should handle many permissions', () => {
      const manyPermissions = Array.from(
        { length: 100 },
        (_, i) => `permission-${i}`,
      );
      Permissions(...manyPermissions);

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, manyPermissions);
    });

    it('should handle special characters in permission names', () => {
      const specialPermissions = [
        'permission:with:colons',
        'permission-with-dashes',
        'permission_with_underscores',
        'permission.with.dots',
      ];
      Permissions(...specialPermissions);

      expect(SetMetadata).toHaveBeenCalledWith(
        PermissionsKey,
        specialPermissions,
      );
    });

    it('should handle duplicate permissions', () => {
      Permissions('read', 'read', 'write');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'read',
        'read',
        'write',
      ]);
    });

    it('should handle permission names with numbers', () => {
      Permissions('user1', 'user2', 'admin123');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'user1',
        'user2',
        'admin123',
      ]);
    });

    it('should handle permission names with mixed case', () => {
      Permissions('READ', 'Write', 'DELETE');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'READ',
        'Write',
        'DELETE',
      ]);
    });

    it('should handle very long permission names', () => {
      const longPermission = 'a'.repeat(1000);
      Permissions(longPermission);

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        longPermission,
      ]);
    });
  });

  describe('Common use cases', () => {
    it('should handle CRUD permissions', () => {
      Permissions('create', 'read', 'update', 'delete');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'create',
        'read',
        'update',
        'delete',
      ]);
    });

    it('should handle resource-specific permissions', () => {
      Permissions('users:read', 'users:write', 'users:delete');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'users:read',
        'users:write',
        'users:delete',
      ]);
    });

    it('should handle role-based permissions', () => {
      Permissions('admin', 'moderator', 'user');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'admin',
        'moderator',
        'user',
      ]);
    });

    it('should handle system permissions', () => {
      Permissions('system:logs', 'system:config', 'system:users');

      expect(SetMetadata).toHaveBeenCalledWith(PermissionsKey, [
        'system:logs',
        'system:config',
        'system:users',
      ]);
    });
  });

  describe('Integration with Guards', () => {
    it('PermissionsKey should match expected key for guard reflection', () => {
      const expectedKey = 'permissions';
      expect(PermissionsKey).toBe(expectedKey);
    });

    it('should pass array of strings for easy guard checking', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      Permissions('read', 'write');

      const callArgs = mockSetMetadata.mock.calls[0];
      expect(Array.isArray(callArgs[1])).toBe(true);
      expect(callArgs[1][0]).toBe('read');
      expect(callArgs[1][1]).toBe('write');
    });

    it('should allow guard to check if user has required permissions', () => {
      const requiredPermissions = ['read', 'write'];
      Permissions(...requiredPermissions);

      const mockSetMetadata = SetMetadata as jest.Mock;
      const callArgs = mockSetMetadata.mock.calls[0];

      expect(callArgs[0]).toBe('permissions');
      expect(callArgs[1]).toEqual(['read', 'write']);
    });
  });

  describe('Decorator composition', () => {
    it('can be applied multiple times on same method', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      class TestController {
        @Permissions('read')
        @Permissions('write')
        async getData() {
          return 'data';
        }
      }

      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
    });

    it('should allow combining with other decorators', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      class TestController {
        @Permissions('admin')
        async getData() {
          return 'data';
        }
      }

      expect(mockSetMetadata).toHaveBeenCalledWith('permissions', ['admin']);
    });
  });
});
