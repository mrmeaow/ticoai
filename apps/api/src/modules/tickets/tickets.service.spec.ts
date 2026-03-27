import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { TicketStatus, TicketPriority } from '@pkg/types';

describe('TicketsService', () => {
  let ticketsService: TicketsService;
  let ticketsRepository: Partial<TicketsRepository>;

  const mockTicket = {
    id: 'ticket-uuid',
    title: 'Test Ticket',
    description: 'Test Description',
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    assignee: null,
    createdBy: { id: 'user-id', name: 'Test User', email: 'test@example.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    ticketsRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findRecent: vi.fn(),
      findByUserId: vi.fn(),
    };

    ticketsService = new TicketsService(ticketsRepository as TicketsRepository);
  });

  describe('findById', () => {
    it('should return a ticket by id', async () => {
      (ticketsRepository.findById as vi.Mock).mockResolvedValue(mockTicket);

      const result = await ticketsService.findById('ticket-uuid');

      expect(result).toEqual(mockTicket);
      expect(ticketsRepository.findById).toHaveBeenCalledWith('ticket-uuid');
    });

    it('should return null if ticket not found', async () => {
      (ticketsRepository.findById as vi.Mock).mockResolvedValue(null);

      const result = await ticketsService.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const mockResult = {
        tickets: [mockTicket],
        total: 1,
        hasMore: false,
        nextCursor: undefined,
      };

      (ticketsRepository.findAll as vi.Mock).mockResolvedValue(mockResult);

      const result = await ticketsService.findAll({}, 'user-id', false);

      expect(result).toEqual(mockResult);
    });

    it('should filter by status', async () => {
      const mockResult = {
        tickets: [mockTicket],
        total: 1,
        hasMore: false,
      };

      (ticketsRepository.findAll as vi.Mock).mockResolvedValue(mockResult);

      await ticketsService.findAll({ status: TicketStatus.OPEN }, 'user-id', false);

      expect(ticketsRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.OPEN }),
      );
    });

    it('should filter by priority', async () => {
      const mockResult = {
        tickets: [mockTicket],
        total: 1,
        hasMore: false,
      };

      (ticketsRepository.findAll as vi.Mock).mockResolvedValue(mockResult);

      await ticketsService.findAll({ priority: TicketPriority.HIGH }, 'user-id', false);

      expect(ticketsRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.HIGH }),
      );
    });
  });

  describe('create', () => {
    it('should create a new ticket', async () => {
      const createDto = {
        title: 'New Ticket',
        description: 'New Description',
        priority: TicketPriority.HIGH,
        createdById: 'user-id',
      };

      (ticketsRepository.create as vi.Mock).mockResolvedValue({
        ...mockTicket,
        ...createDto,
      });

      const result = await ticketsService.create(createDto);

      expect(result.title).toBe(createDto.title);
      expect(ticketsRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a ticket', async () => {
      const updateDto = {
        status: TicketStatus.IN_PROGRESS,
      };

      (ticketsRepository.update as vi.Mock).mockResolvedValue({
        ...mockTicket,
        ...updateDto,
      });
      (ticketsRepository.findById as vi.Mock).mockResolvedValue({
        ...mockTicket,
        ...updateDto,
      });

      const result = await ticketsService.update('ticket-uuid', updateDto);

      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
      expect(ticketsRepository.update).toHaveBeenCalledWith('ticket-uuid', updateDto);
    });
  });

  describe('delete', () => {
    it('should soft delete a ticket', async () => {
      (ticketsRepository.delete as vi.Mock).mockResolvedValue(undefined);

      await ticketsService.delete('ticket-uuid');

      expect(ticketsRepository.delete).toHaveBeenCalledWith('ticket-uuid');
    });
  });

  describe('getStats', () => {
    it('should return ticket statistics', async () => {
      const mockTickets = [
        { ...mockTicket, status: TicketStatus.OPEN },
        { ...mockTicket, status: TicketStatus.IN_PROGRESS },
        { ...mockTicket, status: TicketStatus.RESOLVED },
        { ...mockTicket, priority: TicketPriority.HIGH },
      ];

      (ticketsRepository.findAll as vi.Mock).mockResolvedValue({
        tickets: mockTickets,
        total: 4,
        hasMore: false,
      });

      const stats = await ticketsService.getStats('user-id', false);

      expect(stats.total).toBe(4);
      expect(stats.open).toBeGreaterThanOrEqual(0);
      expect(stats.inProgress).toBeGreaterThanOrEqual(0);
      expect(stats.resolved).toBeGreaterThanOrEqual(0);
      expect(stats.highPriority).toBeGreaterThanOrEqual(0);
    });
  });
});
