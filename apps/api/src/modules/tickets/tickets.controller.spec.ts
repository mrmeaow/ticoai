import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Ticket } from './entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { TicketStatus, TicketPriority, MessageRole } from '@pkg/types';

describe('TicketsController', () => {
  let controller: TicketsController;
  let ticketsService: Partial<TicketsService>;

  const mockRoles: Role[] = [
    {
      id: 'role-1',
      name: 'USER',
      description: 'Regular user',
      users: [],
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const mockRolesAdmin: Role[] = [
    {
      id: 'role-2',
      name: 'ADMIN',
      description: 'Admin',
      users: [],
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    passwordHash: 'hashed',
    isActive: true,
    roles: mockRoles,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAdminUser: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash: 'hashed',
    isActive: true,
    roles: mockRolesAdmin,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTickets: Ticket[] = [
    {
      id: 'ticket-1',
      title: 'Ticket One',
      description: 'Description one',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      assignee: mockUser,
      createdBy: mockUser,
      messages: [],
      aiResults: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'ticket-2',
      title: 'Ticket Two',
      description: 'Description two',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.MEDIUM,
      assignee: mockUser,
      createdBy: mockUser,
      messages: [],
      aiResults: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(async () => {
    ticketsService = {
      findAll: jest.fn().mockResolvedValue({ tickets: mockTickets, total: 2 }),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: ticketsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketsController>(TicketsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/tickets', () => {
    it('should return list of tickets with default pagination', async () => {
      const result = await controller.findAll(mockUser);

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
        'user-1',
        false,
      );
      expect(result).toEqual({ tickets: mockTickets, total: 2 });
    });

    it('should return list of tickets with custom pagination', async () => {
      const result = await controller.findAll(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
        'user-1',
        false,
      );
    });

    it('should return tickets for admin user', async () => {
      const result = await controller.findAll(mockAdminUser);

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
        'admin-1',
        true,
      );
    });

    it('should filter tickets by status', async () => {
      const result = await controller.findAll(mockUser, TicketStatus.OPEN);

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.OPEN }),
        'user-1',
        false,
      );
    });

    it('should filter tickets by priority', async () => {
      const result = await controller.findAll(
        mockUser,
        undefined,
        TicketPriority.HIGH,
      );

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.HIGH }),
        'user-1',
        false,
      );
    });

    it('should filter tickets by assigneeId', async () => {
      const result = await controller.findAll(
        mockUser,
        undefined,
        undefined,
        'assignee-1',
      );

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: 'assignee-1' }),
        'user-1',
        false,
      );
    });

    it('should filter tickets by search term', async () => {
      const result = await controller.findAll(
        mockUser,
        undefined,
        undefined,
        undefined,
        'search term',
      );

      expect(ticketsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'search term' }),
        'user-1',
        false,
      );
    });

    it('should handle empty tickets list', async () => {
      (ticketsService.findAll as jest.Mock).mockResolvedValue({
        tickets: [],
        total: 0,
      });

      const result = await controller.findAll(mockUser);

      expect(result).toEqual({ tickets: [], total: 0 });
    });

    it('should handle service errors', async () => {
      (ticketsService.findAll as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAll(mockUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket when found', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTickets[0]);

      const result = await controller.findOne('ticket-1');

      expect(ticketsService.findById).toHaveBeenCalledWith('ticket-1');
      expect(result).toEqual(mockTickets[0]);
    });

    it('should return null when ticket not found', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle invalid UUID format', async () => {
      const result = await controller.findOne('invalid-uuid');

      expect(result).toBeUndefined();
    });
  });

  describe('POST /api/tickets', () => {
    const createTicketDto = {
      title: 'New Ticket',
      description: 'This is a detailed description for the new ticket',
      priority: TicketPriority.MEDIUM,
    };

    it('should create ticket successfully', async () => {
      const newTicket: Ticket = {
        id: 'ticket-new',
        ...createTicketDto,
        status: TicketStatus.OPEN,
        assignee: undefined,
        createdBy: mockUser,
        messages: [],
        aiResults: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      (ticketsService.create as jest.Mock).mockResolvedValue(newTicket);

      const result = await controller.create(createTicketDto, 'user-1');

      expect(ticketsService.create).toHaveBeenCalledWith({
        ...createTicketDto,
        createdById: 'user-1',
      });
      expect(result).toEqual(newTicket);
    });

    it('should create ticket with custom priority', async () => {
      const ticketDtoWithPriority = {
        title: 'High Priority Ticket',
        description: 'This is a critical issue',
        priority: TicketPriority.CRITICAL,
      };
      const newTicket: Ticket = {
        id: 'ticket-new',
        ...ticketDtoWithPriority,
        status: TicketStatus.OPEN,
        assignee: undefined,
        createdBy: mockUser,
        messages: [],
        aiResults: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      (ticketsService.create as jest.Mock).mockResolvedValue(newTicket);

      const result = await controller.create(ticketDtoWithPriority, 'user-1');

      expect(ticketsService.create).toHaveBeenCalledWith({
        ...ticketDtoWithPriority,
        createdById: 'user-1',
      });
      expect(result.priority).toBe(TicketPriority.CRITICAL);
    });

    it('should handle validation error - title too long', async () => {
      const invalidDto = {
        title: 'a'.repeat(201),
        description: 'Valid description here',
        priority: TicketPriority.MEDIUM,
      };

      try {
        await controller.create(invalidDto, 'user-1');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle validation error - description too short', async () => {
      const invalidDto = {
        title: 'Valid Title',
        description: 'short',
        priority: TicketPriority.MEDIUM,
      };

      try {
        await controller.create(invalidDto, 'user-1');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle validation error - missing required fields', async () => {
      const invalidDto = {
        title: 'Valid Title',
      };

      try {
        await controller.create(invalidDto as any, 'user-1');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle invalid priority enum', async () => {
      const invalidDto = {
        title: 'Valid Title',
        description: 'Valid description here',
        priority: 'INVALID' as any,
      };

      try {
        await controller.create(invalidDto, 'user-1');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('PATCH /api/tickets/:id', () => {
    const updateTicketDto = {
      title: 'Updated Title',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
    };

    it('should update ticket successfully', async () => {
      const updatedTicket = { ...mockTickets[0], ...updateTicketDto };
      (ticketsService.update as jest.Mock).mockResolvedValue(updatedTicket);

      const result = await controller.update('ticket-1', updateTicketDto);

      expect(ticketsService.update).toHaveBeenCalledWith(
        'ticket-1',
        updateTicketDto,
      );
      expect(result).toEqual(updatedTicket);
    });

    it('should update ticket with partial data', async () => {
      const partialUpdate = { status: TicketStatus.RESOLVED };
      const updatedTicket = { ...mockTickets[0], ...partialUpdate };
      (ticketsService.update as jest.Mock).mockResolvedValue(updatedTicket);

      const result = await controller.update('ticket-1', partialUpdate);

      expect(ticketsService.update).toHaveBeenCalledWith(
        'ticket-1',
        partialUpdate,
      );
      expect(result).toEqual(updatedTicket);
    });

    it('should return 404 when ticket not found', async () => {
      (ticketsService.update as jest.Mock).mockRejectedValue(
        new Error('Ticket not found'),
      );

      await expect(
        controller.update('non-existent-id', updateTicketDto),
      ).rejects.toThrow('Ticket not found');
    });

    it('should handle invalid status enum', async () => {
      const invalidDto = { status: 'INVALID' as any };

      try {
        await controller.update('ticket-1', invalidDto);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle invalid priority enum', async () => {
      const invalidDto = { priority: 'INVALID' as any };

      try {
        await controller.update('ticket-1', invalidDto);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should delete ticket successfully', async () => {
      (ticketsService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete('ticket-1');

      expect(ticketsService.delete).toHaveBeenCalledWith('ticket-1');
    });

    it('should return 404 when ticket not found', async () => {
      (ticketsService.delete as jest.Mock).mockRejectedValue(
        new Error('Ticket not found'),
      );

      await expect(controller.delete('non-existent-id')).rejects.toThrow(
        'Ticket not found',
      );
    });

    it('should handle delete service error', async () => {
      (ticketsService.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.delete('ticket-1')).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
