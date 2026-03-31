import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SummarizeTicketDto {
  @ApiProperty({
    description: 'ID of the ticket to summarize',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  ticketId: string;
}
