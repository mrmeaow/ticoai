import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Whether there are more items', example: true })
  hasMore: boolean;

  @ApiPropertyOptional({
    description: 'Cursor for next page (UUID format)',
    format: 'uuid',
  })
  nextCursor?: string;
}
