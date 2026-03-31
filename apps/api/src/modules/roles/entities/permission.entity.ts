import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
@Unique(['resource', 'action'])
export class Permission {
  @ApiProperty({
    description: 'Unique identifier for the permission',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The resource this permission applies to',
    example: 'tickets',
  })
  @Column()
  resource: string;

  @ApiProperty({
    description: 'The action allowed on the resource',
    example: 'read',
  })
  @Column()
  action: string;

  @ApiPropertyOptional({
    description: 'Human-readable description of the permission',
    example: 'View all tickets',
  })
  @Column({ nullable: true })
  description: string;

  @ApiHideProperty()
  @OneToMany(() => RolePermission, (rp: RolePermission) => rp.permission)
  rolePermissions: RolePermission[];

  @ApiProperty({
    description: 'Timestamp when the permission was created',
    format: 'date-time',
  })
  @CreateDateColumn()
  createdAt: Date;
}
