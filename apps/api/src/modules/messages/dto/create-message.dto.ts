import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { MessageRole } from '@pkg/types';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Content of the message',
    example: 'Thank you for reaching out. We are looking into your issue.',
    minLength: 1,
    maxLength: 10000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({
    description: 'Role of the message sender',
    enum: MessageRole,
    example: MessageRole.AGENT,
  })
  @IsOptional()
  @IsEnum(MessageRole)
  role?: MessageRole;
}
