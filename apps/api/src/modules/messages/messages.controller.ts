import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Message } from './entities/message.entity';
import { MessageRole } from '@pkg/types';

@Controller('tickets/:ticketId/messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Permissions('messages:read')
  async findByTicket(
    @Param('ticketId') ticketId: string,
  ): Promise<Message[]> {
    return this.messagesService.findByTicketId(ticketId);
  }

  @Post()
  @Permissions('messages:create')
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

  @Delete(':id')
  @Permissions('messages:delete')
  async delete(@Param('id') id: string): Promise<void> {
    return this.messagesService.delete(id);
  }
}
