import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DetectPriorityDto {
  @ApiProperty({
    description: 'ID of the ticket to analyze for priority detection',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  ticketId: string;
}
