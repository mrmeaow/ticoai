import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiJobStatusDto {
  @ApiProperty({
    description: 'Current status of the AI job',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Result content when job is completed',
    example: 'This ticket is about a billing issue...',
  })
  result?: string;

  @ApiPropertyOptional({
    description: 'Error message when job fails',
    example: 'AI service timeout',
  })
  error?: string;
}
