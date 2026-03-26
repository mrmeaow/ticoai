import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';

@Injectable()
export class TicketsRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async findById(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: { id },
      relations: ['assignee', 'createdBy', 'messages', 'aiResults'],
    });
  }

  async findAll(options: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const { status, priority, assigneeId, search, page = 1, limit = 20 } = options;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assignee = { id: assigneeId };
    if (search) where.title = Like(`%${search}%`);

    const [tickets, total] = await this.ticketRepository.findAndCount({
      where,
      relations: ['assignee', 'createdBy'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { tickets, total };
  }

  async create(ticketData: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.ticketRepository.create(ticketData);
    return this.ticketRepository.save(ticket);
  }

  async update(id: string, ticketData: Partial<Ticket>): Promise<Ticket | null> {
    await this.ticketRepository.update(id, ticketData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.ticketRepository.softDelete(id);
  }

  async findRecent(limit = 5): Promise<Ticket[]> {
    return this.ticketRepository.find({
      relations: ['assignee', 'createdBy'],
      order: { updatedAt: 'DESC' },
      take: limit,
    });
  }
}
