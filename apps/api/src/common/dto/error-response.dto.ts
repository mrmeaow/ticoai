import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Error type', example: 'Bad Request' })
  error: string;

  @ApiProperty({
    description: 'Detailed error message',
    example: 'Title is required',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({ description: 'Timestamp of the error', format: 'date-time' })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Stack trace (development only)',
    example: 'Error: Title is required\n    at...',
  })
  stack?: string;
}
