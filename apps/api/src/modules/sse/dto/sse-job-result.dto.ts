import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SseJobResultDto {
  @ApiProperty({
    description: 'Unique identifier of the job',
    example: 'job_abc123',
  })
  jobId: string;

  @ApiProperty({
    description: 'Current status of the job',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Result data when job completes',
    example: 'AI analysis result...',
  })
  result?: string;

  @ApiPropertyOptional({
    description: 'Error message if job fails',
    example: 'Processing failed due to timeout',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    example: 75,
  })
  progress?: number;
}
