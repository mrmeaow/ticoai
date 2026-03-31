import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TicketsRepository, FindTicketsOptions } from './tickets.repository';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';

describe('TicketsRepository', () => {
  let repository: TicketsRepository;
  let mockRepository: Partial<Repository<Ticket>>;
  let mockQueryBuilder: Partial<SelectQueryBuilder<Ticket>>;

  const mockTicket: Ticket = {
    id: 'ticket-uuid-1',
    title: 'Test Ticket',
    description: 'Test Description',
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    assignee: null,
    createdBy: {
      id: 'user-uuid-1',
      name: 'Test User',
      email: 'test@example.com',
    } as any,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    messages: [],
    aiResults: [],
  };

  const mockTicket2: Ticket = {
    id: 'ticket-uuid-2',
    title: 'Second Ticket',
    description: 'Another Description',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    assignee: {
      id: 'user-uuid-2',
      name: 'Agent',
      email: 'agent@example.com',
    } as any,
    createdBy: {
      id: 'user-uuid-1',
      name: 'Test User',
      email: 'test@example.com',
    } as any,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-04'),
    deletedAt: null,
    messages: [],
    aiResults: [],
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
      getOne: jest.fn().mockResolvedValue(null),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    };

    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsRepository,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<TicketsRepository>(TicketsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a ticket when found with relations', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockTicket);

      const result = await repository.findById('ticket-uuid-1');

      expect(result).toEqual(mockTicket);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-uuid-1' },
        relations: ['assignee', 'createdBy', 'messages', 'aiResults'],
        withDeleted: true,
      });
    });

    it('should return null when ticket not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include relations when finding by id', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockTicket);

      await repository.findById('ticket-uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['assignee', 'createdBy', 'messages', 'aiResults'],
        }),
      );
    });

    it('should include soft-deleted tickets when finding by id', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockTicket);

      await repository.findById('ticket-uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          withDeleted: true,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets with default options', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      const result = await repository.findAll({});

      expect(result.tickets).toEqual([mockTicket]);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination with limit', async () => {
      const tickets = [mockTicket, mockTicket2, mockTicket2];
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(tickets);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(10);

      const result = await repository.findAll({ limit: 2, page: 1 });

      expect(result.tickets).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it('should filter by status', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      await repository.findAll({ status: TicketStatus.OPEN });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.status = :status',
        { status: TicketStatus.OPEN },
      );
    });

    it('should filter by priority', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      await repository.findAll({ priority: TicketPriority.HIGH });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.priority = :priority',
        { priority: TicketPriority.HIGH },
      );
    });

    it('should filter by userId when not admin', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      await repository.findAll({ userId: 'user-uuid-1', isAdmin: false });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.assigneeId = :userId OR ticket.createdById = :userId)',
        { userId: 'user-uuid-1' },
      );
    });

    it('should not filter by userId when isAdmin is true', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      await repository.findAll({ userId: 'user-uuid-1', isAdmin: true });

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('assigneeId'),
      );
    });

    it('should handle search filter', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      await repository.findAll({ search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.title LIKE :search OR ticket.description LIKE :search)',
        { search: '%test%' },
      );
    });

    it('should handle cursor-based pagination', async () => {
      const cursorTicket = {
        id: 'cursor-ticket',
        updatedAt: new Date('2024-01-01'),
      };
      (mockRepository.findOne as jest.Mock).mockResolvedValue(cursorTicket);
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(1);

      await repository.findAll({ cursor: 'cursor-ticket', limit: 10 });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cursor-ticket' },
        select: ['id', 'updatedAt'],
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.updatedAt < :cursorDate',
        { cursorDate: cursorTicket.updatedAt },
      );
    });

    it('should exclude deleted tickets', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(0);

      await repository.findAll({});

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.deletedAt IS NULL',
      );
    });

    it('should order by updatedAt DESC', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(0);

      await repository.findAll({});

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'ticket.updatedAt',
        'DESC',
      );
    });
  });

  describe('create', () => {
    it('should create and return a new ticket', async () => {
      const ticketData = {
        title: 'New Ticket',
        description: 'New Description',
        priority: TicketPriority.HIGH,
      };
      const createdTicket = { ...mockTicket, ...ticketData };

      (mockRepository.create as jest.Mock).mockReturnValue(createdTicket);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdTicket);

      const result = await repository.create(ticketData);

      expect(mockRepository.create).toHaveBeenCalledWith(ticketData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdTicket);
      expect(result).toEqual(createdTicket);
    });
  });

  describe('update', () => {
    it('should update and return the ticket', async () => {
      const updateData = { status: TicketStatus.RESOLVED };
      const updatedTicket = { ...mockTicket, ...updateData };

      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(updatedTicket);

      const result = await repository.update('ticket-uuid-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-1',
        updateData,
      );
      expect(result).toEqual(updatedTicket);
    });

    it('should return null when ticket not found', async () => {
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 0 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.update('non-existent-id', {
        status: TicketStatus.RESOLVED,
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete a ticket', async () => {
      (mockRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await repository.delete('ticket-uuid-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('ticket-uuid-1');
    });
  });

  describe('findRecent', () => {
    it('should return recent tickets with default limit', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([
        mockTicket,
        mockTicket2,
      ]);

      const result = await repository.findRecent(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['assignee', 'createdBy'],
        order: { updatedAt: 'DESC' },
        take: 5,
      });
      expect(result).toEqual([mockTicket, mockTicket2]);
    });

    it('should use custom limit', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([mockTicket]);

      await repository.findRecent(10);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('findByUserId', () => {
    it('should return tickets for non-admin user', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([mockTicket]);

      const result = await repository.findByUserId('user-uuid-1', false);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.assigneeId = :userId OR ticket.createdById = :userId)',
        { userId: 'user-uuid-1' },
      );
      expect(result).toEqual([mockTicket]);
    });

    it('should return all tickets for admin user', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([
        mockTicket,
        mockTicket2,
      ]);

      const result = await repository.findByUserId('admin-uuid', true);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([mockTicket, mockTicket2]);
    });

    it('should exclude deleted tickets', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      await repository.findByUserId('user-uuid-1', false);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.deletedAt IS NULL',
      );
    });

    it('should order by updatedAt DESC', async () => {
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      await repository.findByUserId('user-uuid-1', false);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'ticket.updatedAt',
        'DESC',
      );
    });
  });
});
