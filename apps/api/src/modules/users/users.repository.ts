import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
      select: [
        'id',
        'email',
        'name',
        'passwordHash',
        'isActive',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ],
    });
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { users, total };
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    // Find existing user with roles
    const existingUser = await this.findById(id);
    if (!existingUser) return null;

    // Merge the userData into existing user
    Object.assign(existingUser, userData);

    // Save will handle the many-to-many relation properly
    return this.userRepository.save(existingUser);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async activate(id: string): Promise<User | null> {
    await this.userRepository.update(id, { isActive: true });
    return this.findById(id);
  }

  async deactivate(id: string): Promise<User | null> {
    await this.userRepository.update(id, { isActive: false });
    return this.findById(id);
  }
}
