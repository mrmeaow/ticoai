import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items in the current page',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Total number of items across all pages',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Whether there are more items available after the current page',
    example: true,
  })
  hasMore: boolean;

  @ApiPropertyOptional({
    description: 'Cursor for the next page (UUID format for cursor-based pagination)',
    format: 'uuid',
  })
  nextCursor?: string;

  @ApiPropertyOptional({
    description: 'Current page number (for offset-based pagination)',
    example: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page (for offset-based pagination)',
    example: 20,
  })
  limit?: number;
}
