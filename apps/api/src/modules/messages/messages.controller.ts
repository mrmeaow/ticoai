import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageListResponseDto } from './dto/message-list-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Messages')
@Controller('tickets/:ticketId/messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Permissions('messages:read')
  @ApiOperation({
    summary: 'Get all messages in a ticket',
    description:
      'Returns all messages for a specific ticket, ordered by creation time.',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: [Message],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async findByTicket(@Param('ticketId') ticketId: string): Promise<Message[]> {
    return this.messagesService.findByTicketId(ticketId);
  }

  @Post()
  @Permissions('messages:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a message in a ticket',
    description:
      'Adds a new message to a ticket. The message is attributed to the authenticated user.',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message created successfully',
    type: Message,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async create(
    @Param('ticketId') ticketId: string,
    @Body() body: CreateMessageDto,
    @CurrentUser('id') senderId: string,
  ): Promise<Message> {
    return this.messagesService.create({
      content: body.content,
      ticketId,
      senderId,
      role: body.role,
    });
  }

  @Delete(':messageId')
  @Permissions('messages:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a message',
    description: 'Soft deletes a message. Requires messages:delete permission.',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Message unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Message deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ErrorResponseDto,
  })
  async delete(@Param('messageId') id: string): Promise<void> {
    return this.messagesService.delete(id);
  }
}
