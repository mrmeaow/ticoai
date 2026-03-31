import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserListResponseDto {
  @ApiProperty({
    description: 'Array of users in the current page',
    type: [User],
  })
  users: User[];

  @ApiProperty({
    description: 'Total number of users',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Whether there are more users to load',
    example: true,
  })
  hasMore: boolean;

  @ApiPropertyOptional({
    description: 'Cursor for next page',
    format: 'uuid',
  })
  nextCursor?: string;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of users per page',
    example: 20,
  })
  limit?: number;
}
