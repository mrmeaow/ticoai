import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from '../entities/ticket.entity';

export class TicketListResponseDto {
  @ApiProperty({
    description: 'List of tickets',
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
}
