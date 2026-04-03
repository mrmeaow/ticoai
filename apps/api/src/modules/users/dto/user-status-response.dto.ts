import { ApiProperty } from '@nestjs/swagger';

export class UserStatusResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'User activated successfully',
  })
  message: string;
}
