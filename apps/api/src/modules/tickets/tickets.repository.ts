import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, SelectQueryBuilder } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';

export interface FindTicketsOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  userId?: string;
  isAdmin?: boolean;
}

export interface FindTicketsResult {
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

  async findAll(options: FindTicketsOptions): Promise<FindTicketsResult> {
    const {
      status,
      priority,
      assigneeId,
      search,
      page = 1,
      limit = 20,
      cursor,
      userId,
      isAdmin = false,
    } = options;

    const query = this.ticketRepository.createQueryBuilder('ticket');
    query.leftJoinAndSelect('ticket.assignee', 'assignee');
    query.leftJoinAndSelect('ticket.createdBy', 'createdBy');
    query.where('ticket.deletedAt IS NULL');

    // Ownership scoping: agents see only their tickets, admins see all
    if (!isAdmin && userId) {
      query.andWhere('(ticket.assigneeId = :userId OR ticket.createdById = :userId)', {
        userId,
      });
    }

    // Apply filters
    if (status) {
      query.andWhere('ticket.status = :status', { status });
    }
    if (priority) {
      query.andWhere('ticket.priority = :priority', { priority });
    }
    if (assigneeId) {
      query.andWhere('ticket.assigneeId = :assigneeId', { assigneeId });
    }
    if (search) {
      query.andWhere(
        '(ticket.title LIKE :search OR ticket.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Cursor-based pagination
    if (cursor) {
      const cursorTicket = await this.ticketRepository.findOne({
        where: { id: cursor },
        select: ['id', 'updatedAt'],
      });
      if (cursorTicket) {
        query.andWhere('ticket.updatedAt < :cursorDate', {
          cursorDate: cursorTicket.updatedAt,
        });
      }
    }

    // Get total count (without cursor/pagination for accurate count)
    const countQuery = query.clone();
    const total = await countQuery.getCount();

    // Apply ordering and pagination
    query.orderBy('ticket.updatedAt', 'DESC');
    query.take(limit + 1); // Fetch one extra to check for more results

    const tickets = await query.getMany();

    // Check if there are more results
    let hasMore = tickets.length > limit;
    let nextCursor: string | undefined;

    if (hasMore) {
      tickets.pop(); // Remove the extra ticket
      nextCursor = tickets[tickets.length - 1]?.id;
    }

    return {
      tickets,
      total,
      hasMore,
      nextCursor,
    };
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

  async findByUserId(userId: string, isAdmin = false): Promise<Ticket[]> {
    const query = this.ticketRepository.createQueryBuilder('ticket');
    query.leftJoinAndSelect('ticket.assignee', 'assignee');
    query.leftJoinAndSelect('ticket.createdBy', 'createdBy');
    query.where('ticket.deletedAt IS NULL');

    if (!isAdmin) {
      query.andWhere('(ticket.assigneeId = :userId OR ticket.createdById = :userId)', {
        userId,
      });
    }

    query.orderBy('ticket.updatedAt', 'DESC');
    return query.getMany();
  }
}
