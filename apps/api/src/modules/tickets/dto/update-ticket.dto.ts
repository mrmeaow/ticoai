import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TicketStatus, TicketPriority } from '@pkg/types';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Ticket title (brief summary of the issue)',
    example: 'Updated: Unable to login to customer portal',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the issue or request',
    example: 'Updated description with more details...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Current ticket status',
    enum: TicketStatus,
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Priority level of the ticket',
    enum: TicketPriority,
    example: 'HIGH',
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Assignee user ID (assign ticket to an agent)',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
