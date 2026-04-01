import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'User unique identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'User email address',
    format: 'email',
    example: 'user@example.com',
  })
  email: string;

  @Column()
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  name: string;

  @Column({ select: false })
  @ApiHideProperty()
  @Exclude() // NEVER expose password hash in responses
  passwordHash: string;

  @Column({ default: true })
  @ApiProperty({ description: 'Whether the user is active', example: true })
  isActive: boolean;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'users_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'User roles',
    type: () => [Role],
    example: [{ id: '1', name: 'USER' }],
  })
  roles: Role[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Account creation timestamp',
    format: 'date-time',
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiHideProperty()
  @Exclude() // Hide soft delete column from responses
  deletedAt: Date | null;
}
