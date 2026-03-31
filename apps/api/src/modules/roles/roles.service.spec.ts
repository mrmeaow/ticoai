import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let repository: Partial<RolesRepository>;

  const mockRole: Role = {
    id: 'role-uuid-1',
    name: 'ADMIN',
    description: 'Administrator role',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuperAdminRole: Role = {
    id: 'role-uuid-super',
    name: 'SUPER_ADMIN',
    description: 'Super Administrator',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermission: Permission = {
    id: 'permission-uuid-1',
    resource: 'users',
    action: 'create',
    description: 'Create users',
    rolePermissions: [],
    createdAt: new Date(),
  };

  const mockRolePermission: RolePermission = {
    id: 'rp-uuid-1',
    role: mockRole,
    permission: mockPermission,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      findAllRoles: jest.fn(),
      findRoleByName: jest.fn(),
      findRoleById: jest.fn(),
      createRole: jest.fn(),
      findAllPermissions: jest.fn(),
      findPermission: jest.fn(),
      createPermission: jest.fn(),
      assignPermissionToRole: jest.fn(),
      getPermissionsForRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RolesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('findAllRoles', () => {
    it('should return all roles with relations', async () => {
      const mockRoles = [mockRole, mockSuperAdminRole];
      (repository.findAllRoles as jest.Mock).mockResolvedValue(mockRoles);

      const result = await service.findAllRoles();

      expect(result).toEqual(mockRoles);
      expect(repository.findAllRoles).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no roles exist', async () => {
      (repository.findAllRoles as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllRoles();

      expect(result).toEqual([]);
      expect(repository.findAllRoles).toHaveBeenCalledTimes(1);
    });

    it('should return roles with rolePermissions and permissions relations', async () => {
      const roleWithPermissions: Role = {
        ...mockRole,
        rolePermissions: [mockRolePermission],
      };
      (repository.findAllRoles as jest.Mock).mockResolvedValue([
        roleWithPermissions,
      ]);

      const result = await service.findAllRoles();

      expect(result[0].rolePermissions).toBeDefined();
      expect(repository.findAllRoles).toHaveBeenCalledTimes(1);
    });
  });

  describe('findRoleByName', () => {
    it('should return a role when found', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.findRoleByName('ADMIN');

      expect(result).toEqual(mockRole);
      expect(repository.findRoleByName).toHaveBeenCalledWith('ADMIN');
    });

    it('should return null when role not found', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);

      const result = await service.findRoleByName('NON_EXISTENT');

      expect(result).toBeNull();
      expect(repository.findRoleByName).toHaveBeenCalledWith('NON_EXISTENT');
    });

    it('should find SYSTEM roles (SUPER_ADMIN)', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(
        mockSuperAdminRole,
      );

      const result = await service.findRoleByName('SUPER_ADMIN');

      expect(result).toEqual(mockSuperAdminRole);
      expect(result?.name).toBe('SUPER_ADMIN');
    });
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.createRole('ADMIN', 'Administrator role');

      expect(result).toEqual(mockRole);
      expect(repository.findRoleByName).toHaveBeenCalledWith('ADMIN');
      expect(repository.createRole).toHaveBeenCalledWith(
        'ADMIN',
        'Administrator role',
      );
    });

    it('should create role without description', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue({
        ...mockRole,
        name: 'VIEWER',
        description: undefined,
      });

      const result = await service.createRole('VIEWER');

      expect(result.name).toBe('VIEWER');
      expect(repository.createRole).toHaveBeenCalledWith('VIEWER', undefined);
    });

    it('should throw ConflictException when role name already exists', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(mockRole);

      await expect(
        service.createRole('ADMIN', 'Some description'),
      ).rejects.toThrow(ConflictException);
      expect(repository.findRoleByName).toHaveBeenCalledWith('ADMIN');
      expect(repository.createRole).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate SUPER_ADMIN role', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(
        mockSuperAdminRole,
      );

      await expect(
        service.createRole('SUPER_ADMIN', 'Trying to create duplicate'),
      ).rejects.toThrow(ConflictException);
      expect(repository.createRole).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive role names', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue({
        ...mockRole,
        name: 'admin',
      });

      const result = await service.createRole('admin');

      expect(repository.findRoleByName).toHaveBeenCalledWith('admin');
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [mockPermission];
      (repository.findAllPermissions as jest.Mock).mockResolvedValue(
        mockPermissions,
      );

      const result = await service.findAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(repository.findAllPermissions).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no permissions exist', async () => {
      (repository.findAllPermissions as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllPermissions();

      expect(result).toEqual([]);
    });
  });

  describe('createPermission', () => {
    it('should create a new permission successfully', async () => {
      (repository.findPermission as jest.Mock).mockResolvedValue(null);
      (repository.createPermission as jest.Mock).mockResolvedValue(
        mockPermission,
      );

      const result = await service.createPermission(
        'users',
        'create',
        'Create users',
      );

      expect(result).toEqual(mockPermission);
      expect(repository.findPermission).toHaveBeenCalledWith('users', 'create');
      expect(repository.createPermission).toHaveBeenCalledWith(
        'users',
        'create',
        'Create users',
      );
    });

    it('should create permission without description', async () => {
      (repository.findPermission as jest.Mock).mockResolvedValue(null);
      (repository.createPermission as jest.Mock).mockResolvedValue({
        ...mockPermission,
        resource: 'tickets',
        action: 'read',
        description: undefined,
      });

      const result = await service.createPermission('tickets', 'read');

      expect(result.resource).toBe('tickets');
      expect(result.action).toBe('read');
    });

    it('should throw ConflictException when permission already exists', async () => {
      (repository.findPermission as jest.Mock).mockResolvedValue(
        mockPermission,
      );

      await expect(
        service.createPermission('users', 'create', 'Some description'),
      ).rejects.toThrow(ConflictException);
      expect(repository.createPermission).not.toHaveBeenCalled();
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      (repository.assignPermissionToRole as jest.Mock).mockResolvedValue(
        mockRolePermission,
      );

      await expect(
        service.assignPermissionToRole('role-uuid-1', 'permission-uuid-1'),
      ).resolves.not.toThrow();
      expect(repository.assignPermissionToRole).toHaveBeenCalledWith(
        'role-uuid-1',
        'permission-uuid-1',
      );
    });

    it('should handle duplicate assignment gracefully', async () => {
      const error = new Error('duplicate key value violates unique constraint');
      (error as any).code = '23505';
      (repository.assignPermissionToRole as jest.Mock).mockRejectedValue(error);

      await expect(
        service.assignPermissionToRole('role-uuid-1', 'permission-uuid-1'),
      ).resolves.not.toThrow();
    });

    it('should rethrow non-duplicate errors', async () => {
      const error = new Error('Database connection failed');
      (repository.assignPermissionToRole as jest.Mock).mockRejectedValue(error);

      await expect(
        service.assignPermissionToRole('role-uuid-1', 'permission-uuid-1'),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for a user with roles', async () => {
      const roleWithPerm: Role = {
        ...mockRole,
        rolePermissions: [mockRolePermission],
      };
      (repository.findAllRoles as jest.Mock).mockResolvedValue([roleWithPerm]);
      (repository.getPermissionsForRole as jest.Mock).mockResolvedValue([
        mockPermission,
      ]);

      const result = await service.getUserPermissions('user-uuid-1');

      expect(result).toContain('users:create');
      expect(repository.findAllRoles).toHaveBeenCalled();
    });

    it('should return unique permissions even with multiple roles', async () => {
      const perm1: Permission = {
        ...mockPermission,
        resource: 'users',
        action: 'create',
      };
      const perm2: Permission = {
        ...mockPermission,
        id: 'perm-2',
        resource: 'users',
        action: 'read',
      };
      const perm3: Permission = {
        ...mockPermission,
        id: 'perm-3',
        resource: 'tickets',
        action: 'create',
      };

      const role1: Role = {
        ...mockRole,
        rolePermissions: [{ ...mockRolePermission, permission: perm1 }],
      };
      const role2: Role = {
        ...mockSuperAdminRole,
        id: 'role-2',
        rolePermissions: [
          { ...mockRolePermission, id: 'rp-2', permission: perm2 },
        ],
      };
      const role3: Role = {
        ...mockRole,
        id: 'role-3',
        name: 'AGENT',
        rolePermissions: [
          { ...mockRolePermission, id: 'rp-3', permission: perm3 },
        ],
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([
        role1,
        role2,
        role3,
      ]);
      (repository.getPermissionsForRole as jest.Mock)
        .mockResolvedValueOnce([perm1])
        .mockResolvedValueOnce([perm2])
        .mockResolvedValueOnce([perm3]);

      const result = await service.getUserPermissions('user-uuid-1');

      expect(result).toContain('users:create');
      expect(result).toContain('users:read');
      expect(result).toContain('tickets:create');
    });

    it('should return empty array when no roles exist', async () => {
      (repository.findAllRoles as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserPermissions('user-uuid-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when roles have no permissions', async () => {
      const roleNoPerms: Role = { ...mockRole, rolePermissions: [] };
      (repository.findAllRoles as jest.Mock).mockResolvedValue([roleNoPerms]);
      (repository.getPermissionsForRole as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserPermissions('user-uuid-1');

      expect(result).toEqual([]);
    });
  });

  describe('initializeDefaultRoles', () => {
    it('should create default roles if they do not exist', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue(mockRole);

      await service.initializeDefaultRoles();

      expect(repository.createRole).toHaveBeenCalledTimes(4);
      expect(repository.createRole).toHaveBeenCalledWith(
        'SUPER_ADMIN',
        'Full system access',
      );
      expect(repository.createRole).toHaveBeenCalledWith(
        'ADMIN',
        'Administrative access',
      );
      expect(repository.createRole).toHaveBeenCalledWith(
        'AGENT',
        'Support agent access',
      );
      expect(repository.createRole).toHaveBeenCalledWith(
        'VIEWER',
        'Read-only access',
      );
    });

    it('should skip roles that already exist', async () => {
      (repository.findRoleByName as jest.Mock)
        .mockResolvedValueOnce(mockSuperAdminRole)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (repository.createRole as jest.Mock).mockResolvedValue(mockRole);

      await service.initializeDefaultRoles();

      expect(repository.createRole).toHaveBeenCalledTimes(3);
    });

    it('should not throw when SUPER_ADMIN already exists', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(
        mockSuperAdminRole,
      );

      await expect(service.initializeDefaultRoles()).resolves.not.toThrow();
    });
  });

  describe('initializeDefaultPermissions', () => {
    it('should create all default permissions', async () => {
      (repository.findPermission as jest.Mock).mockResolvedValue(null);
      (repository.createPermission as jest.Mock).mockResolvedValue(
        mockPermission,
      );

      await service.initializeDefaultPermissions();

      expect(repository.createPermission).toHaveBeenCalledTimes(24);
    });

    it('should skip permissions that already exist', async () => {
      (repository.findPermission as jest.Mock).mockResolvedValue(
        mockPermission,
      );

      await service.initializeDefaultPermissions();

      expect(repository.createPermission).not.toHaveBeenCalled();
    });

    it('should create permissions for all resources and actions', async () => {
      const resources = [
        'users',
        'tickets',
        'messages',
        'roles',
        'ai',
        'dashboard',
      ];
      const actions = ['create', 'read', 'update', 'delete'];
      let callCount = 0;

      (repository.findPermission as jest.Mock).mockResolvedValue(null);
      (repository.createPermission as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve(mockPermission);
      });

      await service.initializeDefaultPermissions();

      expect(callCount).toBe(resources.length * actions.length);
    });
  });
});

describe('RolesRepository', () => {
  let repository: RolesRepository;
  let roleRepository: any;
  let permissionRepository: any;
  let rolePermissionRepository: any;

  const mockRoleEntity: Role = {
    id: 'role-uuid-1',
    name: 'ADMIN',
    description: 'Admin role',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermissionEntity: Permission = {
    id: 'perm-uuid-1',
    resource: 'users',
    action: 'create',
    description: 'Create users',
    rolePermissions: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    roleRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    permissionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    rolePermissionRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesRepository,
        { provide: 'RoleRepository', useValue: roleRepository },
        { provide: 'PermissionRepository', useValue: permissionRepository },
        {
          provide: 'RolePermissionRepository',
          useValue: rolePermissionRepository,
        },
      ],
    }).compile();

    repository = module.get<RolesRepository>(RolesRepository);
  });

  describe('findAllRoles', () => {
    it('should return all roles with relations', async () => {
      const mockRoles = [mockRoleEntity];
      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await repository.findAllRoles();

      expect(result).toEqual(mockRoles);
      expect(roleRepository.find).toHaveBeenCalledWith({
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
    });

    it('should return empty array when no roles', async () => {
      roleRepository.find.mockResolvedValue([]);

      const result = await repository.findAllRoles();

      expect(result).toEqual([]);
    });
  });

  describe('findRoleByName', () => {
    it('should return role when found by name', async () => {
      roleRepository.findOne.mockResolvedValue(mockRoleEntity);

      const result = await repository.findRoleByName('ADMIN');

      expect(result).toEqual(mockRoleEntity);
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
    });

    it('should return null when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      const result = await repository.findRoleByName('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findRoleById', () => {
    it('should return role when found by id', async () => {
      roleRepository.findOne.mockResolvedValue(mockRoleEntity);

      const result = await repository.findRoleById('role-uuid-1');

      expect(result).toEqual(mockRoleEntity);
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'role-uuid-1' },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
    });

    it('should return null when role not found by id', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      const result = await repository.findRoleById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createRole', () => {
    it('should create and return a new role', async () => {
      const createdRole = { ...mockRoleEntity };
      roleRepository.create.mockReturnValue(createdRole);
      roleRepository.save.mockResolvedValue(createdRole);

      const result = await repository.createRole('ADMIN', 'Admin role');

      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'ADMIN',
        description: 'Admin role',
      });
      expect(roleRepository.save).toHaveBeenCalledWith(createdRole);
      expect(result).toEqual(createdRole);
    });

    it('should create role without description', async () => {
      roleRepository.create.mockReturnValue({ name: 'VIEWER' });
      roleRepository.save.mockResolvedValue({
        ...mockRoleEntity,
        name: 'VIEWER',
        description: undefined,
      });

      const result = await repository.createRole('VIEWER');

      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'VIEWER',
        description: undefined,
      });
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermissionEntity];
      permissionRepository.find.mockResolvedValue(permissions);

      const result = await repository.findAllPermissions();

      expect(result).toEqual(permissions);
      expect(permissionRepository.find).toHaveBeenCalled();
    });
  });

  describe('findPermission', () => {
    it('should return permission when found', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermissionEntity);

      const result = await repository.findPermission('users', 'create');

      expect(result).toEqual(mockPermissionEntity);
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { resource: 'users', action: 'create' },
      });
    });

    it('should return null when permission not found', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      const result = await repository.findPermission('nonexistent', 'action');

      expect(result).toBeNull();
    });
  });

  describe('createPermission', () => {
    it('should create and return a new permission', async () => {
      permissionRepository.create.mockReturnValue(mockPermissionEntity);
      permissionRepository.save.mockResolvedValue(mockPermissionEntity);

      const result = await repository.createPermission(
        'users',
        'create',
        'Create users',
      );

      expect(permissionRepository.create).toHaveBeenCalledWith({
        resource: 'users',
        action: 'create',
        description: 'Create users',
      });
      expect(permissionRepository.save).toHaveBeenCalledWith(
        mockPermissionEntity,
      );
      expect(result).toEqual(mockPermissionEntity);
    });
  });

  describe('assignPermissionToRole', () => {
    it('should create role-permission association', async () => {
      const rolePermission = {
        id: 'rp-new',
        role: { id: 'role-1' },
        permission: { id: 'perm-1' },
      };
      rolePermissionRepository.create.mockReturnValue(rolePermission);
      rolePermissionRepository.save.mockResolvedValue(rolePermission);

      const result = await repository.assignPermissionToRole(
        'role-1',
        'perm-1',
      );

      expect(rolePermissionRepository.create).toHaveBeenCalledWith({
        role: { id: 'role-1' },
        permission: { id: 'perm-1' },
      });
      expect(result).toEqual(rolePermission);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return permissions for a role', async () => {
      const rolePermissions = [
        { id: 'rp-1', permission: mockPermissionEntity },
      ];
      rolePermissionRepository.find.mockResolvedValue(rolePermissions);

      const result = await repository.getPermissionsForRole('role-uuid-1');

      expect(result).toEqual([mockPermissionEntity]);
      expect(rolePermissionRepository.find).toHaveBeenCalledWith({
        where: { role: { id: 'role-uuid-1' } },
        relations: ['permission'],
      });
    });

    it('should return empty array when role has no permissions', async () => {
      rolePermissionRepository.find.mockResolvedValue([]);

      const result = await repository.getPermissionsForRole('role-uuid-1');

      expect(result).toEqual([]);
    });
  });

  describe('Query with relations', () => {
    it('should load rolePermissions and nested permission relations', async () => {
      const roleWithRelations: Role = {
        ...mockRoleEntity,
        rolePermissions: [
          {
            id: 'rp-1',
            role: mockRoleEntity,
            permission: mockPermissionEntity,
            createdAt: new Date(),
          },
        ],
      };
      roleRepository.findOne.mockResolvedValue(roleWithRelations);

      const result = await repository.findRoleById('role-uuid-1');

      expect(result?.rolePermissions).toBeDefined();
      expect(result?.rolePermissions[0]?.permission).toBeDefined();
      expect(result?.rolePermissions[0]?.permission?.resource).toBe('users');
    });
  });
});

describe('Edge Cases', () => {
  let service: RolesService;
  let repository: Partial<RolesRepository>;

  const mockRole: Role = {
    id: 'role-uuid-1',
    name: 'AGENT',
    description: 'Support agent',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRole: Role = {
    id: 'role-uuid-2',
    name: 'ADMIN',
    description: 'Admin',
    users: [],
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermission: Permission = {
    id: 'perm-uuid-1',
    resource: 'users',
    action: 'create',
    rolePermissions: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      findAllRoles: jest.fn(),
      findRoleByName: jest.fn(),
      createRole: jest.fn(),
      findAllPermissions: jest.fn(),
      findPermission: jest.fn(),
      createPermission: jest.fn(),
      assignPermissionToRole: jest.fn(),
      getPermissionsForRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RolesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('User with multiple roles', () => {
    it('should aggregate permissions from multiple roles', async () => {
      const perm1: Permission = {
        ...mockPermission,
        resource: 'users',
        action: 'read',
      };
      const perm2: Permission = {
        ...mockPermission,
        id: 'p2',
        resource: 'tickets',
        action: 'create',
      };
      const perm3: Permission = {
        ...mockPermission,
        id: 'p3',
        resource: 'messages',
        action: 'delete',
      };

      const role1: Role = {
        ...mockRole,
        rolePermissions: [
          {
            id: 'rp1',
            role: mockRole,
            permission: perm1,
            createdAt: new Date(),
          },
        ],
      };
      const role2: Role = {
        ...mockAdminRole,
        rolePermissions: [
          {
            id: 'rp2',
            role: mockAdminRole,
            permission: perm2,
            createdAt: new Date(),
          },
        ],
      };
      const role3: Role = {
        ...mockRole,
        id: 'r3',
        name: 'VIEWER',
        rolePermissions: [
          {
            id: 'rp3',
            role: { ...mockRole, id: 'r3' },
            permission: perm3,
            createdAt: new Date(),
          },
        ],
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([
        role1,
        role2,
        role3,
      ]);
      (repository.getPermissionsForRole as jest.Mock)
        .mockResolvedValueOnce([perm1])
        .mockResolvedValueOnce([perm2])
        .mockResolvedValueOnce([perm3]);

      const result = await service.getUserPermissions('user-multi-roles');

      expect(result).toContain('users:read');
      expect(result).toContain('tickets:create');
      expect(result).toContain('messages:delete');
      expect(result.length).toBe(3);
    });

    it('should not duplicate permissions when same permission exists in multiple roles', async () => {
      const perm1: Permission = {
        ...mockPermission,
        resource: 'users',
        action: 'read',
      };
      const perm2: Permission = {
        ...mockPermission,
        resource: 'users',
        action: 'read',
      };

      const role1: Role = {
        ...mockRole,
        rolePermissions: [
          {
            id: 'rp1',
            role: mockRole,
            permission: perm1,
            createdAt: new Date(),
          },
        ],
      };
      const role2: Role = {
        ...mockAdminRole,
        rolePermissions: [
          {
            id: 'rp2',
            role: mockAdminRole,
            permission: perm2,
            createdAt: new Date(),
          },
        ],
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([role1, role2]);
      (repository.getPermissionsForRole as jest.Mock)
        .mockResolvedValueOnce([perm1])
        .mockResolvedValueOnce([perm2]);

      const result = await service.getUserPermissions('user-dupe-perms');

      const readPerms = result.filter((p) => p === 'users:read');
      expect(readPerms.length).toBe(1);
    });
  });

  describe('Role-permission assignments', () => {
    it('should handle multiple permissions on a single role', async () => {
      const perms: Permission[] = [
        { ...mockPermission, action: 'create' },
        { ...mockPermission, id: 'p2', action: 'read' },
        { ...mockPermission, id: 'p3', action: 'update' },
        { ...mockPermission, id: 'p4', action: 'delete' },
      ];

      const roleWithManyPerms: Role = {
        ...mockRole,
        rolePermissions: perms.map((p, i) => ({
          id: `rp-${i}`,
          role: mockRole,
          permission: p,
          createdAt: new Date(),
        })),
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([
        roleWithManyPerms,
      ]);
      (repository.getPermissionsForRole as jest.Mock).mockResolvedValue(perms);

      const result = await service.getUserPermissions('user-admin');

      expect(result).toContain('users:create');
      expect(result).toContain('users:read');
      expect(result).toContain('users:update');
      expect(result).toContain('users:delete');
      expect(result.length).toBe(4);
    });
  });

  describe('Permission cascade delete', () => {
    it('should handle role when permissions are deleted (via cascade)', async () => {
      const roleWithNoPerms: Role = {
        ...mockRole,
        rolePermissions: [],
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([
        roleWithNoPerms,
      ]);
      (repository.getPermissionsForRole as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserPermissions('user-after-perm-delete');

      expect(result).toEqual([]);
    });
  });

  describe('SYSTEM roles protection', () => {
    it('should allow creating roles with SUPER_ADMIN-like names for initialization', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue({
        id: 'new-role',
        name: 'SUPER_ADMIN',
        description: 'Full system access',
      });

      const result = await service.createRole(
        'SUPER_ADMIN',
        'Full system access',
      );

      expect(result.name).toBe('SUPER_ADMIN');
      expect(repository.createRole).toHaveBeenCalled();
    });

    it('should prevent duplicate SUPER_ADMIN creation', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue({
        id: 'existing-super',
        name: 'SUPER_ADMIN',
      });

      await expect(
        service.createRole('SUPER_ADMIN', 'Another super admin'),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow initializing default roles including SUPER_ADMIN', async () => {
      (repository.findRoleByName as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (repository.createRole as jest.Mock).mockResolvedValue({});

      await service.initializeDefaultRoles();

      expect(repository.createRole).toHaveBeenCalledWith(
        'SUPER_ADMIN',
        'Full system access',
      );
    });
  });

  describe('Role name validation', () => {
    it('should handle special characters in role names', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue({
        id: 'role-special',
        name: 'CUSTOM_ROLE_123',
      });

      const result = await service.createRole('CUSTOM_ROLE_123');

      expect(result.name).toBe('CUSTOM_ROLE_123');
    });

    it('should handle empty description', async () => {
      (repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (repository.createRole as jest.Mock).mockResolvedValue({
        id: 'role-empty-desc',
        name: 'TEST_ROLE',
        description: undefined,
      });

      const result = await service.createRole('TEST_ROLE', '');

      expect(result.name).toBe('TEST_ROLE');
    });
  });

  describe('Permission resource:action format', () => {
    it('should correctly format permission string', async () => {
      const perm: Permission = {
        ...mockPermission,
        resource: 'tickets',
        action: 'update',
      };
      const role: Role = {
        ...mockRole,
        rolePermissions: [
          {
            id: 'rp1',
            role: mockRole,
            permission: perm,
            createdAt: new Date(),
          },
        ],
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([role]);
      (repository.getPermissionsForRole as jest.Mock).mockResolvedValue([perm]);

      const result = await service.getUserPermissions('user-format-test');

      expect(result).toContain('tickets:update');
    });

    it('should handle all standard CRUD actions', async () => {
      const perms: Permission[] = [
        { ...mockPermission, action: 'create' },
        { ...mockPermission, id: 'p2', action: 'read' },
        { ...mockPermission, id: 'p3', action: 'update' },
        { ...mockPermission, id: 'p4', action: 'delete' },
      ];

      const role: Role = {
        ...mockRole,
        rolePermissions: perms.map((p, i) => ({
          id: `rp-${i}`,
          role: mockRole,
          permission: p,
          createdAt: new Date(),
        })),
      };

      (repository.findAllRoles as jest.Mock).mockResolvedValue([role]);
      (repository.getPermissionsForRole as jest.Mock).mockResolvedValue(perms);

      const result = await service.getUserPermissions('user-crud');

      expect(result).toEqual(
        expect.arrayContaining([
          'users:create',
          'users:read',
          'users:update',
          'users:delete',
        ]),
      );
    });
  });
});
