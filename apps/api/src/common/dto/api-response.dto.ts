import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  @ApiProperty({
    description: 'Success status indicator',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Optional message about the operation result',
    example: 'Operation completed successfully',
  })
  message?: string;
}

export class ApiDeleteResponseDto {
  @ApiProperty({
    description: 'Success status indicator',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Confirmation message',
    example: 'Resource deleted successfully',
  })
  message: string;
}
