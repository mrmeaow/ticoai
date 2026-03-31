import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiJobResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the AI processing job',
    example: 'job_abc123xyz',
  })
  jobId: string;

  @ApiProperty({
    description: 'Unique identifier for retrieving the job result',
    example: 'result_def456uvw',
  })
  resultId: string;

  @ApiPropertyOptional({
    description: 'Estimated time in seconds for job completion',
    example: 30,
  })
  estimatedTimeSeconds?: number;

  @ApiPropertyOptional({
    description: 'Status message about the job',
    example: 'Job queued for processing',
  })
  message?: string;
}
