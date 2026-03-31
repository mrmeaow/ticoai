import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: Partial<RolesService>;

  const mockRoles: Role[] = [
    {
      id: 'role-1',
      name: 'USER',
      description: 'Regular user role',
      users: [],
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'role-2',
      name: 'ADMIN',
      description: 'Admin role',
      users: [],
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPermissions: Permission[] = [
    {
      id: 'perm-1',
      resource: 'tickets',
      action: 'read',
      description: 'Read tickets',
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-2',
      resource: 'tickets',
      action: 'create',
      description: 'Create tickets',
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    rolesService = {
      findAllRoles: jest.fn().mockResolvedValue(mockRoles),
      findAllPermissions: jest.fn().mockResolvedValue(mockPermissions),
      createRole: jest.fn(),
      createPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: rolesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RolesController>(RolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/roles', () => {
    it('should return list of roles', async () => {
      const result = await controller.findAllRoles();

      expect(rolesService.findAllRoles).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });

    it('should handle empty roles list', async () => {
      (rolesService.findAllRoles as jest.Mock).mockResolvedValue([]);

      const result = await controller.findAllRoles();

      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      (rolesService.findAllRoles as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAllRoles()).rejects.toThrow('Database error');
    });
  });

  describe('GET /api/roles/permissions', () => {
    it('should return list of permissions', async () => {
      const result = await controller.findAllPermissions();

      expect(rolesService.findAllPermissions).toHaveBeenCalled();
      expect(result).toEqual(mockPermissions);
    });

    it('should handle empty permissions list', async () => {
      (rolesService.findAllPermissions as jest.Mock).mockResolvedValue([]);

      const result = await controller.findAllPermissions();

      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      (rolesService.findAllPermissions as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAllPermissions()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('POST /api/roles', () => {
    const createRoleDto = {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator role',
    };

    it('should create a role successfully', async () => {
      const newRole: Role = {
        id: 'role-new',
        ...createRoleDto,
        users: [],
        rolePermissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (rolesService.createRole as jest.Mock).mockResolvedValue(newRole);

      const result = await controller.createRole(createRoleDto);

      expect(rolesService.createRole).toHaveBeenCalledWith(
        createRoleDto.name,
        createRoleDto.description,
      );
      expect(result).toEqual(newRole);
    });

    it('should create a role without description', async () => {
      const createRoleDtoNoDesc = { name: 'NEW_ROLE' };
      const newRole: Role = {
        id: 'role-new',
        name: 'NEW_ROLE',
        description: undefined,
        users: [],
        rolePermissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (rolesService.createRole as jest.Mock).mockResolvedValue(newRole);

      const result = await controller.createRole(createRoleDtoNoDesc);

      expect(rolesService.createRole).toHaveBeenCalledWith(
        'NEW_ROLE',
        undefined,
      );
      expect(result).toEqual(newRole);
    });

    it('should handle duplicate role name', async () => {
      (rolesService.createRole as jest.Mock).mockRejectedValue(
        new Error('Role name already exists'),
      );

      await expect(controller.createRole(createRoleDto)).rejects.toThrow(
        'Role name already exists',
      );
    });

    it('should handle missing role name', async () => {
      const invalidDto = { description: 'Some description' };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [RolesController],
        providers: [
          {
            provide: RolesService,
            useValue: rolesService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controller = module.get<RolesController>(RolesController);

      try {
        await controller.createRole(invalidDto as any);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('POST /api/roles/permissions', () => {
    const createPermissionDto = {
      resource: 'users',
      action: 'delete',
      description: 'Delete users',
    };

    it('should create a permission successfully', async () => {
      const newPermission: Permission = {
        id: 'perm-new',
        ...createPermissionDto,
        rolePermissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (rolesService.createPermission as jest.Mock).mockResolvedValue(
        newPermission,
      );

      const result = await controller.createPermission(createPermissionDto);

      expect(rolesService.createPermission).toHaveBeenCalledWith(
        createPermissionDto.resource,
        createPermissionDto.action,
        createPermissionDto.description,
      );
      expect(result).toEqual(newPermission);
    });

    it('should create a permission without description', async () => {
      const createPermDtoNoDesc = { resource: 'users', action: 'read' };
      const newPermission: Permission = {
        id: 'perm-new',
        ...createPermDtoNoDesc,
        description: undefined,
        rolePermissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (rolesService.createPermission as jest.Mock).mockResolvedValue(
        newPermission,
      );

      const result = await controller.createPermission(createPermDtoNoDesc);

      expect(rolesService.createPermission).toHaveBeenCalledWith(
        'users',
        'read',
        undefined,
      );
      expect(result).toEqual(newPermission);
    });

    it('should handle duplicate permission', async () => {
      (rolesService.createPermission as jest.Mock).mockRejectedValue(
        new Error('Permission already exists'),
      );

      await expect(
        controller.createPermission(createPermissionDto),
      ).rejects.toThrow('Permission already exists');
    });

    it('should handle missing required fields', async () => {
      const invalidDto = { resource: 'users' };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [RolesController],
        providers: [
          {
            provide: RolesService,
            useValue: rolesService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const controller = module.get<RolesController>(RolesController);

      try {
        await controller.createPermission(invalidDto as any);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });
});
