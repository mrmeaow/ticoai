import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { RolesService } from '../roles/roles.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findAll(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    return this.usersRepository.findAll(page, limit);
  }

  async create(
    email: string,
    password: string,
    name: string,
    roleNames: string[] = ['AGENT'],
  ): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const roles: Role[] = [];
    for (const roleName of roleNames) {
      const role = await this.rolesService.findRoleByName(roleName);
      if (!role) {
        throw new BadRequestException(`Role '${roleName}' not found`);
      }
      roles.push(role);
    }

    const user = await this.usersRepository.create({
      email,
      passwordHash,
      name,
      roles,
    });

    return user;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.usersRepository.update(id, userData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<User> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.update(id, { passwordHash });
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async activate(id: string): Promise<User> {
    const user = await this.usersRepository.activate(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.usersRepository.deactivate(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async assignRoles(id: string, roleNames: string[]): Promise<User> {
    const roles: Role[] = [];
    for (const roleName of roleNames) {
      const role = await this.rolesService.findRoleByName(roleName);
      if (!role) {
        throw new BadRequestException(`Role '${roleName}' not found`);
      }
      roles.push(role);
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.roles = roles;
    const updated = await this.usersRepository.update(id, user);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
