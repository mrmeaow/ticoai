import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:read')
  @ApiOperation({
    summary: 'List all roles',
    description:
      'Returns a list of all roles in the system. Requires roles:read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
    type: [Role],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  async findAllRoles(): Promise<Role[]> {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @Permissions('roles:read')
  @ApiOperation({
    summary: 'List all permissions',
    description:
      'Returns a list of all available permissions. Requires roles:read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of permissions retrieved successfully',
    type: [Permission],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  async findAllPermissions(): Promise<Permission[]> {
    return this.rolesService.findAllPermissions();
  }

  @Post()
  @Permissions('roles:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new role',
    description:
      'Creates a new role with the specified name and optional description. Requires roles:create permission.',
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: Role,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Role already exists',
    type: ErrorResponseDto,
  })
  async createRole(@Body() body: CreateRoleDto): Promise<Role> {
    return this.rolesService.createRole(body.name, body.description);
  }

  @Post('permissions')
  @Permissions('roles:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new permission',
    description:
      'Creates a new permission with resource, action, and optional description. Requires roles:create permission.',
  })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: Permission,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Permission already exists',
    type: ErrorResponseDto,
  })
  async createPermission(
    @Body() body: CreatePermissionDto,
  ): Promise<Permission> {
    return this.rolesService.createPermission(
      body.resource,
      body.action,
      body.description,
    );
  }
}
