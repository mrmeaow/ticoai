import { CurrentUser } from './current-user.decorator';
import { ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

describe('CurrentUser', () => {
  let mockContext: ExecutionContext;
  let mockRequest: { user: User | null };

  beforeEach(() => {
    mockRequest = {
      user: null,
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  const createDecorator = () => {
    return (data: keyof User | undefined, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;
      if (!user) {
        return null;
      }
      return data ? user[data] : user;
    };
  };

  describe('CurrentUser decorator', () => {
    it('should be defined', () => {
      expect(CurrentUser).toBeDefined();
    });

    describe('Extract user from request', () => {
      it('should return full user object when no data parameter provided', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContext);

        expect(result).toEqual(mockUser);
      });

      it('should return specific user property when data parameter provided', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('id', mockContext);

        expect(result).toBe('user-123');
      });

      it('should return email when data is "email"', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('email', mockContext);

        expect(result).toBe('test@example.com');
      });

      it('should return name when data is "name"', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('name', mockContext);

        expect(result).toBe('Test User');
      });

      it('should return isActive when data is "isActive"', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('isActive', mockContext);

        expect(result).toBe(true);
      });

      it('should return roles when data is "roles"', () => {
        const mockRoles = [{ id: 'role-1', name: 'USER' }];
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: mockRoles as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('roles', mockContext);

        expect(result).toEqual(mockRoles);
      });

      it('should return passwordHash when data is "passwordHash"', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('passwordHash', mockContext);

        expect(result).toBe('hashed');
      });
    });

    describe('Handle missing user', () => {
      it('should return null when user is null', () => {
        mockRequest.user = null;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContext);

        expect(result).toBeNull();
      });

      it('should return null when user is undefined', () => {
        mockRequest.user = undefined as unknown as User;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContext);

        expect(result).toBeNull();
      });

      it('should return null when request.user does not exist', () => {
        const mockContextWithoutUser = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({}),
          }),
        } as unknown as ExecutionContext;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContextWithoutUser);

        expect(result).toBeNull();
      });

      it('should return null when data parameter provided but user is null', () => {
        mockRequest.user = null;
        const decoratorFn = createDecorator();
        const result = decoratorFn('id', mockContext);

        expect(result).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should work with empty user object', () => {
        mockRequest.user = {} as User;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContext);

        expect(result).toEqual({});
      });

      it('should return undefined for non-existent property', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn('nonExistent' as keyof User, mockContext);

        expect(result).toBeUndefined();
      });
    });

    describe('Different execution contexts', () => {
      it('should work with HTTP context', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContext);

        expect(result).toEqual(mockUser);
      });

      it('should extract user from request correctly', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        const httpContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({ user: mockUser }),
          }),
        } as unknown as ExecutionContext;

        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, httpContext);

        expect(result).toEqual(mockUser);
      });
    });

    describe('Decorator behavior', () => {
      it('CurrentUser should be a param decorator factory', () => {
        expect(typeof CurrentUser).toBe('function');
      });

      it('should handle different data types', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();

        expect(decoratorFn('id', mockContext)).toBe('user-123');
        expect(decoratorFn('email', mockContext)).toBe('test@example.com');
        expect(decoratorFn('name', mockContext)).toBe('Test User');
        expect(decoratorFn('isActive', mockContext)).toBe(true);
      });

      it('should work with user with all properties', () => {
        const mockUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          isActive: true,
          roles: [
            {
              id: 'role-1',
              name: 'USER',
              permissions: [],
              users: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          deletedAt: null,
        };

        mockRequest.user = mockUser;
        const decoratorFn = createDecorator();
        const result = decoratorFn(undefined, mockContext);

        expect(result).toEqual(mockUser);
      });
    });
  });
});
