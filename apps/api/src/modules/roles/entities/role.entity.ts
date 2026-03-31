import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the role', format: 'uuid' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Unique name of the role', example: 'admin' })
  name: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({ description: 'Description of the role', example: 'Administrator role with full access' })
  description: string;

  @ManyToMany(() => User, (user) => user.roles)
  @ApiHideProperty()
  users: User[];

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  @ApiHideProperty()
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  @ApiProperty({ description: 'Date and time when the role was created', format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Date and time when the role was last updated', format: 'date-time' })
  updatedAt: Date;
}
