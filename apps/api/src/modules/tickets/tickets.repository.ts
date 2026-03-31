import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';

export interface FindTicketsOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
  userId?: string;
  isAdmin?: boolean;
  search?: string;
  cursor?: string;
  limit?: number;
  page?: number;
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

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
      withDeleted: true,
    });
  }

  async findAll(options: FindTicketsOptions = {}): Promise<PaginatedTickets> {
    const query = this.ticketRepository.createQueryBuilder('ticket');
    query.leftJoinAndSelect('ticket.assignee', 'assignee');
    query.leftJoinAndSelect('ticket.createdBy', 'createdBy');
    query.where('ticket.deletedAt IS NULL');

    if (options.status) {
      query.andWhere('ticket.status = :status', { status: options.status });
    }

    if (options.priority) {
      query.andWhere('ticket.priority = :priority', {
        priority: options.priority,
      });
    }

    if (options.userId && !options.isAdmin) {
      query.andWhere(
        '(ticket.assigneeId = :userId OR ticket.createdById = :userId)',
        {
          userId: options.userId,
        },
      );
    }

    if (options.search) {
      query.andWhere(
        '(ticket.title LIKE :search OR ticket.description LIKE :search)',
        {
          search: `%${options.search}%`,
        },
      );
    }

    if (options.cursor) {
      const cursorTicket = await this.ticketRepository.findOne({
        where: { id: options.cursor },
        select: ['id', 'updatedAt'],
      });
      if (cursorTicket) {
        query.andWhere('ticket.updatedAt < :cursorDate', {
          cursorDate: cursorTicket.updatedAt,
        });
      }
    }

    query.orderBy('ticket.updatedAt', 'DESC');

    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit + 1);

    const [tickets, total] = await Promise.all([
      query.getMany(),
      this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.deletedAt IS NULL')
        .getCount(),
    ]);

    const hasMore = tickets.length > limit;
    if (hasMore) {
      tickets.pop();
    }

    const nextCursor =
      hasMore && tickets.length > 0
        ? tickets[tickets.length - 1].id
        : undefined;

    return { tickets, total, hasMore, nextCursor };
  }

  async create(ticketData: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.ticketRepository.create(ticketData);
    return this.ticketRepository.save(ticket);
  }

  async update(
    id: string,
    ticketData: Partial<Ticket>,
  ): Promise<Ticket | null> {
    // Handle assigneeId relation properly
    if (ticketData.assigneeId) {
      await this.ticketRepository.manager.query(
        'UPDATE "tickets" SET "assigneeId" = $1 WHERE "id" = $2',
        [ticketData.assigneeId, id],
      );
      delete ticketData.assigneeId;
    }

    if (Object.keys(ticketData).length > 0) {
      await this.ticketRepository.update(id, ticketData);
    }

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

  async findByUserId(userId: string, isAdmin = false): Promise<Ticket[]> {
    const query = this.ticketRepository.createQueryBuilder('ticket');
    query.leftJoinAndSelect('ticket.assignee', 'assignee');
    query.leftJoinAndSelect('ticket.createdBy', 'createdBy');
    query.where('ticket.deletedAt IS NULL');

    if (!isAdmin) {
      query.andWhere(
        '(ticket.assigneeId = :userId OR ticket.createdById = :userId)',
        {
          userId,
        },
      );
    }

    query.orderBy('ticket.updatedAt', 'DESC');
    return query.getMany();
  }
}
