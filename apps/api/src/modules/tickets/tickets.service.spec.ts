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

      await expect(ticketsService.findById('non-existent-id')).rejects.toThrow(
        'Ticket not found',
      );
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

      await ticketsService.findAll(
        { status: TicketStatus.OPEN },
        'user-id',
        false,
      );

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

      await ticketsService.findAll(
        { priority: TicketPriority.HIGH },
        'user-id',
        false,
      );

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

      const mockCreator = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      };
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

    it('should create ticket with assigneeId successfully', async () => {
      const createDto = {
        title: 'New Ticket',
        description: 'New Description',
        priority: TicketPriority.HIGH,
        createdById: 'user-id',
        assigneeId: 'assignee-id',
      };

      const mockCreator = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockAssignee = {
        id: 'assignee-id',
        name: 'Assignee User',
        email: 'assignee@example.com',
      };

      (usersService.findById as jest.Mock)
        .mockResolvedValueOnce(mockAssignee)
        .mockResolvedValueOnce(mockCreator);
      (ticketsRepository.create as jest.Mock).mockResolvedValue({
        ...mockTicket,
        title: createDto.title,
        description: createDto.description,
        priority: createDto.priority,
        createdBy: mockCreator,
        assignee: mockAssignee,
      });

      const result = await ticketsService.create(createDto);

      expect(result.assignee).toEqual(mockAssignee);
      expect(ticketsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignee: mockAssignee,
        }),
      );
    });

    it('should throw NotFoundException when assignee not found during create', async () => {
      const createDto = {
        title: 'New Ticket',
        description: 'New Description',
        priority: TicketPriority.HIGH,
        createdById: 'user-id',
        assigneeId: 'non-existent-assignee',
      };

      (usersService.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(ticketsService.create(createDto)).rejects.toThrow(
        'Assignee not found',
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
      expect(ticketsRepository.update).toHaveBeenCalledWith(
        'ticket-uuid',
        updateDto,
      );
    });

    it('should update ticket with assigneeId successfully', async () => {
      const updateDto = {
        assigneeId: 'new-assignee-id',
      };

      const mockAssignee = {
        id: 'new-assignee-id',
        name: 'New Assignee',
        email: 'newassignee@example.com',
      };
      (usersService.findById as jest.Mock).mockResolvedValue(mockAssignee);
      (ticketsRepository.findById as jest.Mock).mockResolvedValue(mockTicket);
      (ticketsRepository.update as jest.Mock).mockResolvedValue({
        ...mockTicket,
        assignee: mockAssignee,
      });

      const result = await ticketsService.update('ticket-uuid', updateDto);

      expect(ticketsRepository.update).toHaveBeenCalledWith('ticket-uuid', {
        assigneeId: 'new-assignee-id',
      });
    });

    it('should throw NotFoundException when assignee not found during update', async () => {
      const updateDto = {
        assigneeId: 'non-existent-assignee',
      };

      (ticketsRepository.findById as jest.Mock).mockResolvedValue(mockTicket);
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        ticketsService.update('ticket-uuid', updateDto),
      ).rejects.toThrow('Assignee not found');
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

      (ticketsRepository.findByUserId as jest.Mock).mockResolvedValue(
        mockTickets,
      );
      (ticketsRepository.findRecent as jest.Mock).mockResolvedValue([]);

      const stats = await ticketsService.getStats('user-id', false);

      expect(stats.total).toBe(4);
      expect(stats.open).toBeGreaterThanOrEqual(0);
      expect(stats.inProgress).toBeGreaterThanOrEqual(0);
      expect(stats.resolved).toBeGreaterThanOrEqual(0);
      expect(stats.highPriority).toBeGreaterThanOrEqual(0);
    });

    it('should return zeros when no tickets exist', async () => {
      (ticketsRepository.findByUserId as jest.Mock).mockResolvedValue([]);
      (ticketsRepository.findRecent as jest.Mock).mockResolvedValue([]);

      const stats = await ticketsService.getStats('user-id', false);

      expect(stats.total).toBe(0);
      expect(stats.open).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.resolved).toBe(0);
      expect(stats.highPriority).toBe(0);
    });

    it('should count tickets across all statuses correctly', async () => {
      const mockTickets = [
        {
          ...mockTicket,
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
        },
        {
          ...mockTicket,
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
        },
        {
          ...mockTicket,
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.MEDIUM,
        },
        {
          ...mockTicket,
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.HIGH,
        },
        {
          ...mockTicket,
          status: TicketStatus.CLOSED,
          priority: TicketPriority.LOW,
        },
      ];

      (ticketsRepository.findByUserId as jest.Mock).mockResolvedValue(
        mockTickets,
      );
      (ticketsRepository.findRecent as jest.Mock).mockResolvedValue([]);

      const stats = await ticketsService.getStats('user-id', false);

      expect(stats.total).toBe(5);
      expect(stats.open).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.resolved).toBe(1);
      expect(stats.closed).toBe(1);
      expect(stats.highPriority).toBe(2);
    });
  });
});
