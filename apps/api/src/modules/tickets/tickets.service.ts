import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  TicketsRepository,
  FindTicketsOptions,
  PaginatedTickets,
} from './tickets.repository';
import { UsersService } from '../users/users.service';
import { Ticket } from './entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';

export interface CreateTicketDto {
  title: string;
  description: string;
  priority?: TicketPriority;
  assigneeId?: string;
  createdById: string;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly usersService: UsersService,
  ) {}

  async findById(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async findAll(
    options: FindTicketsOptions,
    userId?: string,
    isAdmin = false,
  ): Promise<PaginatedTickets> {
    return this.ticketsRepository.findAll({
      ...options,
      userId,
      isAdmin,
    });
  }

  async create(dto: CreateTicketDto): Promise<Ticket> {
    let assignee: User | undefined;
    if (dto.assigneeId) {
      const foundAssignee = await this.usersService.findById(dto.assigneeId);
      if (!foundAssignee) {
        throw new NotFoundException('Assignee not found');
      }
      assignee = foundAssignee;
    }

    const createdBy = await this.usersService.findById(dto.createdById);
    if (!createdBy) {
      throw new NotFoundException('Creator not found');
    }

    return this.ticketsRepository.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      assignee,
      createdBy,
    });
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findById(id);

    if (dto.assigneeId) {
      const assignee = await this.usersService.findById(dto.assigneeId);
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
      dto.assigneeId = assignee.id;
    }

    const updated = await this.ticketsRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Ticket not found');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.ticketsRepository.delete(id);
  }

  async getStats(
    userId?: string,
    isAdmin = false,
  ): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    highPriority: number;
    recent: Ticket[];
  }> {
    const tickets = await this.ticketsRepository.findByUserId(userId!, isAdmin);

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
      inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS)
        .length,
      resolved: tickets.filter((t) => t.status === TicketStatus.RESOLVED)
        .length,
      closed: tickets.filter((t) => t.status === TicketStatus.CLOSED).length,
      highPriority: tickets.filter(
        (t) =>
          t.priority === TicketPriority.HIGH ||
          t.priority === TicketPriority.CRITICAL,
      ).length,
    };

    const recent = await this.ticketsRepository.findRecent(5);

    return { ...stats, recent };
  }
}
