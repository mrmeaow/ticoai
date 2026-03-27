import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { TicketStatus, TicketPriority } from '@pkg/types';

describe('TicketsService', () => {
  let ticketsService: TicketsService;
  let ticketsRepository: Partial<TicketsRepository>;
  let usersRepository: Partial<UsersRepository>;
  let usersService: Partial<UsersService>;

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

  beforeEach(async () => {
    ticketsRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findRecent: jest.fn(),
      findByUserId: jest.fn(),
    };

    usersRepository = {
      findById: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TicketsRepository, useValue: ticketsRepository },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    ticketsService = module.get<TicketsService>(TicketsService);
  });

  describe('findById', () => {
    it('should return a ticket by id', async () => {
      (ticketsRepository.findById as jest.Mock).mockResolvedValue(mockTicket);

      const result = await ticketsService.findById('ticket-uuid');

      expect(result).toEqual(mockTicket);
      expect(ticketsRepository.findById).toHaveBeenCalledWith('ticket-uuid');
    });

    it('should throw NotFoundException if ticket not found', async () => {
      (ticketsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(ticketsService.findById('non-existent-id'))
        .rejects.toThrow('Ticket not found');
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

      (ticketsRepository.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await ticketsService.findAll({}, 'user-id', false);

      expect(result).toEqual(mockResult);
    });

    it('should filter by status', async () => {
      const mockResult = {
        tickets: [mockTicket],
        total: 1,
        hasMore: false,
      };

      (ticketsRepository.findAll as jest.Mock).mockResolvedValue(mockResult);

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

      (ticketsRepository.findAll as jest.Mock).mockResolvedValue(mockResult);

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

      const mockCreator = { id: 'user-id', name: 'Test User', email: 'test@example.com' };
      (usersService.findById as jest.Mock).mockResolvedValue(mockCreator);
      (ticketsRepository.create as jest.Mock).mockResolvedValue({
        ...mockTicket,
        title: createDto.title,
        description: createDto.description,
        priority: createDto.priority,
        createdBy: mockCreator,
      });

      const result = await ticketsService.create(createDto);

      expect(result.title).toBe(createDto.title);
      expect(usersService.findById).toHaveBeenCalledWith(createDto.createdById);
      expect(ticketsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          description: createDto.description,
          priority: createDto.priority,
          createdBy: mockCreator,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a ticket', async () => {
      const updateDto = {
        status: TicketStatus.IN_PROGRESS,
      };

      (ticketsRepository.update as jest.Mock).mockResolvedValue({
        ...mockTicket,
        ...updateDto,
      });
      (ticketsRepository.findById as jest.Mock).mockResolvedValue({
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
      (ticketsRepository.delete as jest.Mock).mockResolvedValue(undefined);

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

      (ticketsRepository.findByUserId as jest.Mock).mockResolvedValue(mockTickets);

      const stats = await ticketsService.getStats('user-id', false);

      expect(stats.total).toBe(4);
      expect(stats.open).toBeGreaterThanOrEqual(0);
      expect(stats.inProgress).toBeGreaterThanOrEqual(0);
      expect(stats.resolved).toBeGreaterThanOrEqual(0);
      expect(stats.highPriority).toBeGreaterThanOrEqual(0);
    });
  });
});
