import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:read')
  async findAllRoles(): Promise<Role[]> {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @Permissions('roles:read')
  async findAllPermissions(): Promise<Permission[]> {
    return this.rolesService.findAllPermissions();
  }

  @Post()
  @Permissions('roles:create')
  async createRole(
    @Body() body: { name: string; description?: string },
  ): Promise<Role> {
    return this.rolesService.createRole(body.name, body.description);
  }

  @Post('permissions')
  @Permissions('roles:create')
  async createPermission(
    @Body() body: { resource: string; action: string; description?: string },
  ): Promise<Permission> {
    return this.rolesService.createPermission(
      body.resource,
      body.action,
      body.description,
    );
  }
}
