import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({
    summary: 'List all users',
    description:
      'Returns a paginated list of users. Requires users:read permission.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: UserListResponseDto,
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
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<{ users: User[]; total: number }> {
    return this.usersService.findAll(
      parseInt(page.toString()),
      parseInt(limit.toString()),
    );
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Returns the authenticated user's profile information.",
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Allows the authenticated user to update their own profile.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.update(userId, body);
  }

  @Patch(':id')
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Update a user',
    description: 'Updates an existing user. Requires users:update permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
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
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, body);
  }

  @Post(':id/activate')
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Activate a user',
    description: 'Activates a deactivated user account.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: User,
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
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.usersService.activate(id);
  }

  @Post(':id/deactivate')
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Deactivate a user',
    description: 'Deactivates a user account without deleting it.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: User,
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
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async deactivateUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/roles')
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Assign roles to a user',
    description:
      'Assigns one or more roles to a user. Replaces existing roles.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiBody({ type: AssignRolesDto })
  @ApiResponse({
    status: 200,
    description: 'Roles assigned successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid role names',
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
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async assignRoles(
    @Param('id') id: string,
    @Body() body: AssignRolesDto,
  ): Promise<User> {
    return this.usersService.assignRoles(id, body.roles);
  }

  @Delete(':id')
  @Permissions('users:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Soft deletes a user. Requires users:delete permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
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
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
