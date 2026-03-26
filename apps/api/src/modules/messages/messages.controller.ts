import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Message } from './entities/message.entity';
import { MessageRole } from '@pkg/types';

@Controller('tickets/:ticketId/messages')
@ApiTags('Messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Permissions('messages:read')
  @ApiOperation({ summary: 'Get all messages in a ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 200, type: [Message] })
  async findByTicket(
    @Param('ticketId') ticketId: string,
  ): Promise<Message[]> {
    return this.messagesService.findByTicketId(ticketId);
  }

  @Post()
  @Permissions('messages:create')
  @ApiOperation({ summary: 'Create a message in a ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 201, type: Message })
  async create(
    @Param('ticketId') ticketId: string,
    @Body() body: { content: string },
    @CurrentUser('id') senderId: string,
  ): Promise<Message> {
    return this.messagesService.create({
      content: body.content,
      ticketId,
      senderId,
      role: MessageRole.AGENT,
    });
  }

  @Delete(':messageId')
  @Permissions('messages:delete')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200 })
  async delete(@Param('messageId') id: string): Promise<void> {
    return this.messagesService.delete(id);
  }
}
