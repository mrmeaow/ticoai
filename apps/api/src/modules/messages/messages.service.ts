import { Injectable, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { TicketsService } from '../tickets/tickets.service';
import { UsersService } from '../users/users.service';
import { Message } from './entities/message.entity';
import { MessageRole } from '@pkg/types';

interface CreateMessageDto {
  content: string;
  ticketId: string;
  senderId: string;
  role?: MessageRole;
  aiJobId?: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly ticketsService: TicketsService,
    private readonly usersService: UsersService,
  ) {}

  async findByTicketId(ticketId: string): Promise<Message[]> {
    await this.ticketsService.findById(ticketId);
    return this.messagesRepository.findByTicketId(ticketId);
  }

  async create(dto: CreateMessageDto): Promise<Message> {
    const ticket = await this.ticketsService.findById(dto.ticketId);
    const sender = await this.usersService.findById(dto.senderId);

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    return this.messagesRepository.create({
      content: dto.content,
      role: dto.role || MessageRole.AGENT,
      ticket,
      sender,
      aiJobId: dto.aiJobId,
    });
  }

  async createAiMessage(
    ticketId: string,
    content: string,
    jobId: string,
  ): Promise<Message> {
    const ticket = await this.ticketsService.findById(ticketId);

    return this.messagesRepository.create({
      content,
      role: MessageRole.AI,
      ticket,
      aiJobId: jobId,
    });
  }

  async delete(id: string): Promise<void> {
    await this.messagesRepository.delete(id);
  }
}
