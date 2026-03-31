import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Array of role names to assign to the user',
    example: ['ADMIN', 'AGENT'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  roles: string[];
}
