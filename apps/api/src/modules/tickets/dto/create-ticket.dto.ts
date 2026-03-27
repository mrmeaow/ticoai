import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { TicketPriority } from '@pkg/types';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Ticket title (brief summary of the issue)',
    example: 'Unable to login to customer portal',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue or request',
    example: 'Customer reports being unable to access the dashboard after successful login. Error message appears: "Session expired".',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({
    description: 'Priority level of the ticket',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
    example: TicketPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Assignee user ID (admin only - assigns ticket to another user)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
