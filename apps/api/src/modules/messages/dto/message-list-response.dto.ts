import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../entities/message.entity';

export class MessageListResponseDto {
  @ApiProperty({
    description: 'Array of messages for the ticket',
    type: [Message],
  })
  messages: Message[];

  @ApiProperty({
    description: 'Total number of messages',
    example: 15,
  })
  total: number;
}
