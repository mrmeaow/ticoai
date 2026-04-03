import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from '../entities/ticket.entity';

export class TicketListResponseDto {
  @ApiProperty({
    description: 'List of tickets in the current page',
    type: () => [Ticket],
  })
  tickets: Ticket[];

  @ApiProperty({
    description: 'Total number of tickets matching the filter',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Whether there are more tickets to load',
    example: true,
  })
  hasMore: boolean;

  @ApiPropertyOptional({
    description: 'Cursor for next page (UUID of last ticket)',
    format: 'uuid',
  })
  nextCursor?: string;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of tickets per page',
    example: 20,
  })
  limit?: number;
}
