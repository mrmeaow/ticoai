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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users:read')
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
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string },
  ): Promise<User> {
    return this.usersService.update(userId, body);
  }

  @Patch(':id')
  @Permissions('users:update')
  async updateUser(
    @Param('id') id: string,
    @Body() body: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(id, body);
  }

  @Post(':id/activate')
  @Permissions('users:update')
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.usersService.activate(id);
  }

  @Post(':id/deactivate')
  @Permissions('users:update')
  async deactivateUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/roles')
  @Permissions('users:update')
  async assignRoles(
    @Param('id') id: string,
    @Body() body: { roles: string[] },
  ): Promise<User> {
    return this.usersService.assignRoles(id, body.roles);
  }

  @Delete(':id')
  @Permissions('users:delete')
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
