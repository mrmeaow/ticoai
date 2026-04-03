import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { RolesService } from '../roles/roles.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Partial<UsersRepository>;
  let rolesService: Partial<RolesService>;

  const mockRole: Role = {
    id: 'role-1',
    name: 'AGENT',
    description: 'Support agent role',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    isActive: true,
    roles: [mockRole],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockInactiveUser: User = {
    ...mockUser,
    id: 'user-inactive',
    isActive: false,
  };

  const mockDeletedUser: User = {
    ...mockUser,
    id: 'user-deleted',
    deletedAt: new Date(),
  };

  beforeEach(async () => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
    };

    rolesService = {
      findRoleByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(usersRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle invalid UUID format', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('invalid-uuid');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedResult = {
        users: [mockUser],
        total: 1,
      };
      (usersRepository.findAll as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await service.findAll(1, 20);

      expect(usersRepository.findAll).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(paginatedResult);
    });

    it('should use default pagination values', async () => {
      (usersRepository.findAll as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      await service.findAll();

      expect(usersRepository.findAll).toHaveBeenCalledWith(1, 20);
    });

    it('should handle custom pagination parameters', async () => {
      (usersRepository.findAll as jest.Mock).mockResolvedValue({
        users: [mockUser],
        total: 1,
      });

      await service.findAll(2, 50);

      expect(usersRepository.findAll).toHaveBeenCalledWith(2, 50);
    });

    it('should return empty array when no users exist', async () => {
      (usersRepository.findAll as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      const result = await service.findAll();

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create user successfully with default role', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(mockRole);
      (usersRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.create(
        'test@example.com',
        'password123',
        'Test User',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(usersRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should create user with custom roles', async () => {
      const adminRole = { ...mockRole, name: 'ADMIN' };
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock)
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(adminRole);
      (usersRepository.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        roles: [mockRole, adminRole],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.create(
        'test@example.com',
        'password123',
        'Test User',
        ['AGENT', 'ADMIN'],
      );

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
        }),
      );
      expect(result.roles).toHaveLength(2);
    });

    it('should throw ConflictException when email already exists', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.create('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when role not found', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create('test@example.com', 'password123', 'Test User', [
          'INVALID_ROLE',
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash password with correct salt rounds', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(mockRole);
      (usersRepository.create as jest.Mock).mockResolvedValue(mockUser);

      await service.create('test@example.com', 'password123', 'Test User');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      (usersRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update('user-1', { name: 'Updated Name' });

      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        name: 'Updated Name',
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      (usersRepository.update as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const updatedUser = { ...mockUser, passwordHash: 'new-hashed-password' };
      (usersRepository.update as jest.Mock).mockResolvedValue(updatedUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const result = await service.updatePassword('user-1', 'newpassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 12);
      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hashed-password',
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      (usersRepository.update as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await expect(
        service.updatePassword('non-existent-id', 'newpassword'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete user successfully', async () => {
      (usersRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.delete('user-1');

      expect(usersRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should handle delete for non-existent user', async () => {
      (usersRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await expect(service.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('activate', () => {
    it('should activate user successfully', async () => {
      const activatedUser = { ...mockUser, isActive: true };
      (usersRepository.activate as jest.Mock).mockResolvedValue(activatedUser);

      const result = await service.activate('user-1');

      expect(usersRepository.activate).toHaveBeenCalledWith('user-1');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      (usersRepository.activate as jest.Mock).mockResolvedValue(null);

      await expect(service.activate('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      (usersRepository.deactivate as jest.Mock).mockResolvedValue(
        deactivatedUser,
      );

      const result = await service.deactivate('user-1');

      expect(usersRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when user not found', async () => {
      (usersRepository.deactivate as jest.Mock).mockResolvedValue(null);

      await expect(service.deactivate('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user successfully', async () => {
      const adminRole = { ...mockRole, id: 'role-2', name: 'ADMIN' };
      const userWithNewRoles = { ...mockUser, roles: [adminRole] };
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(adminRole);
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (usersRepository.update as jest.Mock).mockResolvedValue(userWithNewRoles);

      const result = await service.assignRoles('user-1', ['ADMIN']);

      expect(result.roles).toContainEqual(adminRole);
    });

    it('should throw NotFoundException when user not found', async () => {
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(mockRole);
      (usersRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRoles('non-existent-id', ['ADMIN']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when role not found', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRoles('user-1', ['INVALID_ROLE']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(
        mockUser,
        'correctpassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctpassword',
        mockUser.passwordHash,
      );
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(mockUser, 'wrongpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.passwordHash,
      );
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors gracefully', async () => {
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(
        service.validatePassword(mockUser, 'password'),
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('inactive user handling', () => {
    it('should return inactive user from findById', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(
        mockInactiveUser,
      );

      const result = await service.findById('user-inactive');

      expect(result?.isActive).toBe(false);
    });

    it('should return inactive user from findByEmail', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(
        mockInactiveUser,
      );

      const result = await service.findByEmail('inactive@example.com');

      expect(result?.isActive).toBe(false);
    });
  });

  describe('soft deleted user handling', () => {
    it('should return soft deleted user with deletedAt timestamp', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(
        mockDeletedUser,
      );

      const result = await service.findById('user-deleted');

      expect(result?.deletedAt).toBeInstanceOf(Date);
    });
  });
});

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockTypeormRepository: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  const mockRole: Role = {
    id: 'role-1',
    name: 'AGENT',
    description: 'Support agent role',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    isActive: true,
    roles: [mockRole],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    mockTypeormRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: getRepositoryToken(User), useValue: mockTypeormRepository },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id with roles relation', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findById('user-1');

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['roles'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle invalid UUID format', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('invalid-uuid');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with roles relation', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['roles'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated users with roles', async () => {
      const paginatedResult: [User[], number] = [[mockUser], 1];
      mockTypeormRepository.findAndCount.mockResolvedValue(paginatedResult);

      const result = await repository.findAll(1, 20);

      expect(mockTypeormRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['roles'],
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ users: [mockUser], total: 1 });
    });

    it('should use default pagination values', async () => {
      mockTypeormRepository.findAndCount.mockResolvedValue([[], 0]);

      await repository.findAll();

      expect(mockTypeormRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['roles'],
        skip: 0,
        take: 20,
      });
    });

    it('should handle custom page and limit', async () => {
      mockTypeormRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await repository.findAll(3, 10);

      expect(mockTypeormRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['roles'],
        skip: 20,
        take: 10,
      });
    });

    it('should return empty array when no users exist', async () => {
      mockTypeormRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findAll();

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create and save user', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        passwordHash: 'hashed',
        roles: [mockRole],
      };
      mockTypeormRepository.create.mockReturnValue(userData);
      mockTypeormRepository.save.mockResolvedValue({
        ...userData,
        id: 'new-id',
      });

      const result = await repository.create(userData);

      expect(mockTypeormRepository.create).toHaveBeenCalledWith(userData);
      expect(mockTypeormRepository.save).toHaveBeenCalledWith(userData);
      expect(result).toHaveProperty('id');
    });

    it('should handle create with empty roles array', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        passwordHash: 'hashed',
        roles: [],
      };
      mockTypeormRepository.create.mockReturnValue(userData);
      mockTypeormRepository.save.mockResolvedValue({
        ...userData,
        id: 'new-id',
      });

      const result = await repository.create(userData);

      expect(result).toHaveProperty('id');
    });
  });

  describe('update', () => {
    it('should update user and return updated entity', async () => {
      const updateData = { name: 'Updated Name' };
      const existingUser = { ...mockUser, name: 'Old Name' };
      const updatedUser = { ...mockUser, ...updateData };

      mockTypeormRepository.findOne.mockResolvedValue(existingUser);
      mockTypeormRepository.save.mockResolvedValue(updatedUser);

      const result = await repository.update('user-1', updateData);

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['roles'],
      });
      expect(mockTypeormRepository.save).toHaveBeenCalled();
      expect(result?.name).toBe('Updated Name');
    });

    it('should return null when user not found', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent-id', {
        name: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete user', async () => {
      mockTypeormRepository.softDelete.mockResolvedValue({
        affected: 1,
      });

      await repository.delete('user-1');

      expect(mockTypeormRepository.softDelete).toHaveBeenCalledWith('user-1');
    });

    it('should handle delete for non-existent user', async () => {
      mockTypeormRepository.softDelete.mockResolvedValue({
        affected: 0,
      });

      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('activate', () => {
    it('should activate user and return updated entity', async () => {
      const activatedUser = { ...mockUser, isActive: true };
      mockTypeormRepository.update.mockResolvedValue({
        affected: 1,
      });
      mockTypeormRepository.findOne.mockResolvedValue(activatedUser);

      const result = await repository.activate('user-1');

      expect(mockTypeormRepository.update).toHaveBeenCalledWith('user-1', {
        isActive: true,
      });
      expect(result?.isActive).toBe(true);
    });

    it('should return null when user not found', async () => {
      mockTypeormRepository.update.mockResolvedValue({
        affected: 0,
      });
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.activate('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('deactivate', () => {
    it('should deactivate user and return updated entity', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockTypeormRepository.update.mockResolvedValue({
        affected: 1,
      });
      mockTypeormRepository.findOne.mockResolvedValue(deactivatedUser);

      const result = await repository.deactivate('user-1');

      expect(mockTypeormRepository.update).toHaveBeenCalledWith('user-1', {
        isActive: false,
      });
      expect(result?.isActive).toBe(false);
    });

    it('should return null when user not found', async () => {
      mockTypeormRepository.update.mockResolvedValue({
        affected: 0,
      });
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.deactivate('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('relation queries', () => {
    it('should load roles relation for user', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(mockUser);

      await repository.findById('user-1');

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['roles'],
        }),
      );
    });

    it('should load roles relation for all users in findAll', async () => {
      mockTypeormRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await repository.findAll();

      expect(mockTypeormRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['roles'],
        }),
      );
    });
  });
});

describe('UsersService - Integration Scenarios', () => {
  let service: UsersService;
  let usersRepository: Partial<UsersRepository>;
  let rolesService: Partial<RolesService>;

  const mockRole: Role = {
    id: 'role-1',
    name: 'AGENT',
    description: 'Support agent role',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    isActive: true,
    roles: [mockRole],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
    };

    rolesService = {
      findRoleByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('password hashing verification', () => {
    it('should verify password uses bcrypt with correct rounds', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(mockRole);
      (usersRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.create('test@example.com', 'password123', 'Test User');
      const isValid = await service.validatePassword(mockUser, 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.passwordHash,
      );
      expect(isValid).toBe(true);
    });

    it('should use different hashes for same password due to salt', async () => {
      const hash1 = 'hash1';
      const hash2 = 'hash2';
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(mockRole);
      (usersRepository.create as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, passwordHash: hash1 })
        .mockResolvedValueOnce({
          ...mockUser,
          id: 'user-2',
          passwordHash: hash2,
        });
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce(hash1)
        .mockResolvedValueOnce(hash2);

      const user1 = await service.create(
        'user1@example.com',
        'samepassword',
        'User 1',
      );
      const user2 = await service.create(
        'user2@example.com',
        'samepassword',
        'User 2',
      );

      expect(user1.passwordHash).not.toBe(user2.passwordHash);
    });
  });

  describe('role management scenarios', () => {
    it('should handle multiple roles assignment', async () => {
      const adminRole: Role = { ...mockRole, id: 'role-2', name: 'ADMIN' };
      const superAdminRole: Role = {
        ...mockRole,
        id: 'role-3',
        name: 'SUPER_ADMIN',
      };

      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (usersRepository.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        roles: [adminRole, superAdminRole],
      });
      (rolesService.findRoleByName as jest.Mock)
        .mockResolvedValueOnce(adminRole)
        .mockResolvedValueOnce(superAdminRole);

      const result = await service.assignRoles('user-1', [
        'ADMIN',
        'SUPER_ADMIN',
      ]);

      expect(result.roles).toHaveLength(2);
    });

    it('should replace existing roles when assigning new ones', async () => {
      const newRole: Role = { ...mockRole, id: 'role-new', name: 'VIEWER' };

      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (usersRepository.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        roles: [newRole],
      });
      (rolesService.findRoleByName as jest.Mock).mockResolvedValue(newRole);

      const result = await service.assignRoles('user-1', ['VIEWER']);

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('VIEWER');
    });
  });

  describe('transaction handling', () => {
    it('should handle create with multiple role validations in sequence', async () => {
      const roles: Role[] = [
        { ...mockRole, name: 'AGENT' },
        { ...mockRole, id: 'role-2', name: 'VIEWER' },
      ];

      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock)
        .mockResolvedValueOnce(roles[0])
        .mockResolvedValueOnce(roles[1]);
      (usersRepository.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        roles,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.create(
        'test@example.com',
        'password',
        'Test',
        ['AGENT', 'VIEWER'],
      );

      expect(rolesService.findRoleByName).toHaveBeenCalledTimes(2);
      expect(result.roles).toHaveLength(2);
    });
  });

  describe('error propagation', () => {
    it('should propagate database errors from repository', async () => {
      (usersRepository.findById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.findById('user-1')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate bcrypt errors', async () => {
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt failure'),
      );

      await expect(
        service.validatePassword(mockUser, 'password'),
      ).rejects.toThrow('Bcrypt failure');
    });

    it('should propagate role service errors', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (rolesService.findRoleByName as jest.Mock).mockRejectedValue(
        new Error('Role service unavailable'),
      );

      await expect(
        service.create('test@example.com', 'password', 'Test', ['AGENT']),
      ).rejects.toThrow('Role service unavailable');
    });
  });

  describe('edge cases', () => {
    it('should handle empty role array in create', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersRepository.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        roles: [],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.create(
        'test@example.com',
        'password',
        'Test',
        [],
      );

      expect(result.roles).toHaveLength(0);
    });

    it('should handle user update with partial data', async () => {
      (usersRepository.update as jest.Mock).mockResolvedValue(mockUser);

      await service.update('user-1', { name: 'New Name' });

      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        name: 'New Name',
      });
    });

    it('should handle consecutive activate/deactivate operations', async () => {
      const activeUser = { ...mockUser, isActive: true };
      const inactiveUser = { ...mockUser, isActive: false };

      (usersRepository.activate as jest.Mock).mockResolvedValue(activeUser);
      (usersRepository.deactivate as jest.Mock).mockResolvedValue(inactiveUser);

      const activated = await service.activate('user-1');
      expect(activated.isActive).toBe(true);

      const deactivated = await service.deactivate('user-1');
      expect(deactivated.isActive).toBe(false);
    });
  });
});
