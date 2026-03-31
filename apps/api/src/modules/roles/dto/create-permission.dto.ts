import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Resource the permission applies to',
    example: 'tickets',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  resource: string;

  @ApiProperty({
    description: 'Action allowed on the resource',
    example: 'read',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  action: string;

  @ApiPropertyOptional({
    description: 'Description of the permission',
    example: 'View all tickets in the system',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
