import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Unique(['role', 'permission'])
export class RolePermission {
  @ApiProperty({
    description: 'Unique identifier for the role permission',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Role associated with this permission',
    type: () => Role,
  })
  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ApiProperty({
    description: 'Permission associated with this role',
    type: () => Permission,
  })
  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @ApiProperty({
    description: 'Date and time when the role permission was created',
    format: 'date-time',
  })
  @CreateDateColumn()
  createdAt: Date;
}
