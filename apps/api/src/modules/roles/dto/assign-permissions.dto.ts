import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
