import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Permission } from '../entities/permission.entity';

export class RoleResponseDto {
  @ApiProperty({
    description: 'Role unique identifier',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'ADMIN',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Administrator role',
  })
  description?: string;

  @ApiProperty({
    description: 'Permissions associated with this role',
    type: [Permission],
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'Role creation timestamp',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Role last update timestamp',
    format: 'date-time',
  })
  updatedAt: Date;
}
