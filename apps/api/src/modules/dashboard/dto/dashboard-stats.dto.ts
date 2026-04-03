import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from '../../tickets/entities/ticket.entity';

export class TicketStatsDto {
  @ApiProperty({ description: 'Total number of tickets', example: 150 })
  total: number;

  @ApiProperty({ description: 'Number of open tickets', example: 25 })
  open: number;

  @ApiProperty({ description: 'Number of in-progress tickets', example: 10 })
  inProgress: number;

  @ApiProperty({ description: 'Number of resolved tickets', example: 100 })
  resolved: number;

  @ApiProperty({ description: 'Number of closed tickets', example: 15 })
  closed: number;

  @ApiProperty({ description: 'Number of high priority tickets', example: 5 })
  highPriority: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Ticket statistics', type: TicketStatsDto })
  stats: TicketStatsDto;

  @ApiProperty({
    description: 'Recently created tickets',
    type: [Ticket],
    isArray: true,
  })
  recentTickets: Ticket[];

  @ApiPropertyOptional({
    description: 'Average resolution time in hours',
    example: 24.5,
  })
  avgResolutionHours?: number;
}
