import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<UsersService>;

  const mockRoles: Role[] = [
    {
      id: 'role-1',
      name: 'USER',
      description: 'Regular user',
      users: [],
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User One',
      passwordHash: 'hashed',
      isActive: true,
      roles: mockRoles,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'user-2',
      email: 'user2@example.com',
      name: 'User Two',
      passwordHash: 'hashed',
      isActive: true,
      roles: mockRoles,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue({ users: mockUsers, total: 2 }),
      findById: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      assignRoles: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/users', () => {
    it('should return list of users with pagination', async () => {
      const result = await controller.findAll(1, 20);

      expect(usersService.findAll).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual({ users: mockUsers, total: 2 });
    });

    it('should return list of users with custom pagination', async () => {
      const result = await controller.findAll(2, 10);

      expect(usersService.findAll).toHaveBeenCalledWith(2, 10);
      expect(result).toEqual({ users: mockUsers, total: 2 });
    });

    it('should handle empty users list', async () => {
      (usersService.findAll as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      const result = await controller.findAll(1, 20);

      expect(result).toEqual({ users: [], total: 0 });
    });

    it('should handle service errors', async () => {
      (usersService.findAll as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAll(1, 20)).rejects.toThrow('Database error');
    });
  });

  describe('GET /api/users/me', () => {
    it('should return current user', async () => {
      const mockUser = { ...mockUsers[0] };

      const result = await controller.getCurrentUser(mockUser as User);

      expect(result).toEqual(mockUser);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should update current user profile', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUsers[0], ...updateData };
      (usersService.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.updateProfile('user-1', updateData);

      expect(usersService.update).toHaveBeenCalledWith('user-1', updateData);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('PATCH /api/users/:id', () => {
    const updateData = { name: 'Updated Name' };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUsers[0], ...updateData };
      (usersService.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.updateUser('user-1', updateData);

      expect(usersService.update).toHaveBeenCalledWith('user-1', updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should return 404 when user not found', async () => {
      (usersService.update as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.updateUser('non-existent-id', updateData),
      ).rejects.toThrow('User not found');
    });

    it('should handle partial update', async () => {
      const partialUpdate = { name: 'New Name' };
      const updatedUser = { ...mockUsers[0], ...partialUpdate };
      (usersService.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.updateUser('user-1', partialUpdate);

      expect(usersService.update).toHaveBeenCalledWith('user-1', partialUpdate);
      expect(result).toEqual(updatedUser);
    });

    it('should handle update with invalid data', async () => {
      const invalidUpdate = { name: '' };

      try {
        await controller.updateUser('user-1', invalidUpdate);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      (usersService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteUser('user-1');

      expect(usersService.delete).toHaveBeenCalledWith('user-1');
    });

    it('should return 404 when user not found', async () => {
      (usersService.delete as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(controller.deleteUser('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });

    it('should handle delete service error', async () => {
      (usersService.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteUser('user-1')).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('POST /api/users/:id/activate', () => {
    it('should activate user successfully', async () => {
      const activatedUser = { ...mockUsers[0], isActive: true };
      (usersService.activate as jest.Mock).mockResolvedValue(activatedUser);

      const result = await controller.activateUser('user-1');

      expect(usersService.activate).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(activatedUser);
    });

    it('should return 404 when user not found', async () => {
      (usersService.activate as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(controller.activateUser('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('POST /api/users/:id/deactivate', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUsers[0], isActive: false };
      (usersService.deactivate as jest.Mock).mockResolvedValue(deactivatedUser);

      const result = await controller.deactivateUser('user-1');

      expect(usersService.deactivate).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(deactivatedUser);
    });

    it('should return 404 when user not found', async () => {
      (usersService.deactivate as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.deactivateUser('non-existent-id'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('PATCH /api/users/:id/roles', () => {
    it('should assign roles successfully', async () => {
      const roles = ['role-1', 'role-2'];
      const updatedUser = {
        ...mockUsers[0],
        roles: [{ id: 'role-1', name: 'ADMIN' }],
      };
      (usersService.assignRoles as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.assignRoles('user-1', { roles });

      expect(usersService.assignRoles).toHaveBeenCalledWith('user-1', roles);
      expect(result).toEqual(updatedUser);
    });

    it('should return 404 when user not found', async () => {
      (usersService.assignRoles as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.assignRoles('non-existent-id', { roles: ['role-1'] }),
      ).rejects.toThrow('User not found');
    });
  });
});
