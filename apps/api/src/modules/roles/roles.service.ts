import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAllRoles(): Promise<Role[]> {
    return this.rolesRepository.findAllRoles();
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findRoleByName(name);
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const existingRole = await this.rolesRepository.findRoleByName(name);
    if (existingRole) {
      throw new ConflictException(`Role '${name}' already exists`);
    }
    return this.rolesRepository.createRole(name, description);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.rolesRepository.findAllPermissions();
  }

  async createPermission(resource: string, action: string, description?: string): Promise<Permission> {
    const existingPermission = await this.rolesRepository.findPermission(resource, action);
    if (existingPermission) {
      throw new ConflictException(`Permission '${resource}:${action}' already exists`);
    }
    return this.rolesRepository.createPermission(resource, action, description);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    try {
      await this.rolesRepository.assignPermissionToRole(roleId, permissionId);
    } catch (e: any) {
      if (!e.message?.includes('already exists') && !e.code?.includes('23505')) {
        throw e;
      }
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.rolesRepository.findAllRoles();
    const permissions = new Set<string>();

    for (const role of userRoles) {
      const rolePermissions = await this.rolesRepository.getPermissionsForRole(role.id);
      for (const permission of rolePermissions) {
        permissions.add(`${permission.resource}:${permission.action}`);
      }
    }

    return Array.from(permissions);
  }

  async initializeDefaultRoles(): Promise<void> {
    const defaultRoles = [
      { name: 'SUPER_ADMIN', description: 'Full system access' },
      { name: 'ADMIN', description: 'Administrative access' },
      { name: 'AGENT', description: 'Support agent access' },
      { name: 'VIEWER', description: 'Read-only access' },
    ];

    for (const roleData of defaultRoles) {
      try {
        await this.createRole(roleData.name, roleData.description);
      } catch (e) {
        if (!(e instanceof ConflictException)) {
          throw e;
        }
      }
    }
  }

  async initializeDefaultPermissions(): Promise<void> {
    const resources = ['users', 'tickets', 'messages', 'roles', 'ai', 'dashboard'];
    const actions = ['create', 'read', 'update', 'delete'];

    for (const resource of resources) {
      for (const action of actions) {
        try {
          await this.createPermission(resource, action);
        } catch (e) {
          if (!(e instanceof ConflictException)) {
            throw e;
          }
        }
      }
    }
  }
}
