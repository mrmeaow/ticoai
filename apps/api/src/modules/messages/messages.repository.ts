import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageRole } from '@pkg/types';

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async findById(id: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['ticket', 'sender'],
    });
  }

  async findByTicketId(ticketId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { ticket: { id: ticketId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(messageData: Partial<Message>): Promise<Message> {
    const message = this.messageRepository.create(messageData);
    return this.messageRepository.save(message);
  }

  async delete(id: string): Promise<void> {
    await this.messageRepository.softDelete(id);
  }
}
