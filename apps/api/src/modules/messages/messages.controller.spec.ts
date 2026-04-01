import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Message } from './entities/message.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { MessageRole } from '@pkg/types';

describe('MessagesController', () => {
  let controller: MessagesController;
  let messagesService: Partial<MessagesService>;

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

  const mockTicket: Ticket = {
    id: 'ticket-1',
    title: 'Test Ticket',
    description: 'Test description',
    status: 'OPEN' as any,
    priority: 'MEDIUM' as any,
    assignee: mockUser,
    createdBy: mockUser,
    messages: [],
    aiResults: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockMessages: Message[] = [
    {
      id: 'message-1',
      content: 'First message content',
      role: MessageRole.CUSTOMER,
      ticket: mockTicket,
      sender: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'message-2',
      content: 'Second message content',
      role: MessageRole.AGENT,
      ticket: mockTicket,
      sender: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(async () => {
    messagesService = {
      findByTicketId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: messagesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/tickets/:ticketId/messages', () => {
    it('should return list of messages for a ticket', async () => {
      (messagesService.findByTicketId as jest.Mock).mockResolvedValue(
        mockMessages,
      );

      const result = await controller.findByTicket('ticket-1');

      expect(messagesService.findByTicketId).toHaveBeenCalledWith('ticket-1');
      expect(result).toEqual(mockMessages);
    });

    it('should handle empty messages list', async () => {
      (messagesService.findByTicketId as jest.Mock).mockResolvedValue([]);

      const result = await controller.findByTicket('ticket-1');

      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      (messagesService.findByTicketId as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findByTicket('ticket-1')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle invalid ticket ID', async () => {
      (messagesService.findByTicketId as jest.Mock).mockResolvedValue([]);

      const result = await controller.findByTicket('invalid-id');

      expect(messagesService.findByTicketId).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('POST /api/tickets/:ticketId/messages', () => {
    const createMessageDto = {
      content: 'New message content',
    };

    it('should create message successfully', async () => {
      const newMessage: Message = {
        id: 'message-new',
        content: createMessageDto.content,
        role: MessageRole.AGENT,
        ticket: mockTicket,
        sender: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      (messagesService.create as jest.Mock).mockResolvedValue(newMessage);

      const result = await controller.create(
        'ticket-1',
        createMessageDto,
        'user-1',
      );

      expect(messagesService.create).toHaveBeenCalledWith({
        content: createMessageDto.content,
        ticketId: 'ticket-1',
        senderId: 'user-1',
        role: undefined,
      });
      expect(result).toEqual(newMessage);
    });

    it('should create message with agent role set by controller', async () => {
      const createMessageDtoCustomer = {
        content: 'Customer message',
      };
      const newMessage: Message = {
        id: 'message-new',
        content: createMessageDtoCustomer.content,
        role: MessageRole.AGENT,
        ticket: mockTicket,
        sender: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      (messagesService.create as jest.Mock).mockResolvedValue(newMessage);

      const result = await controller.create(
        'ticket-1',
        createMessageDtoCustomer,
        'user-1',
      );

      expect(messagesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: createMessageDtoCustomer.content,
          ticketId: 'ticket-1',
          senderId: 'user-1',
          role: undefined,
        }),
      );
      expect(result.role).toBe(MessageRole.AGENT);
    });

    it('should handle empty content', async () => {
      const invalidDto = { content: '' };

      try {
        await controller.create('ticket-1', invalidDto, 'user-1');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle missing content', async () => {
      try {
        await controller.create('ticket-1', {} as any, 'user-1');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle create service error', async () => {
      (messagesService.create as jest.Mock).mockRejectedValue(
        new Error('Create failed'),
      );

      await expect(
        controller.create('ticket-1', createMessageDto, 'user-1'),
      ).rejects.toThrow('Create failed');
    });
  });

  describe('DELETE /api/tickets/:ticketId/messages/:messageId', () => {
    it('should delete message successfully', async () => {
      (messagesService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete('message-1');

      expect(messagesService.delete).toHaveBeenCalledWith('message-1');
    });

    it('should return 404 when message not found', async () => {
      (messagesService.delete as jest.Mock).mockRejectedValue(
        new Error('Message not found'),
      );

      await expect(controller.delete('non-existent-id')).rejects.toThrow(
        'Message not found',
      );
    });

    it('should handle delete service error', async () => {
      (messagesService.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.delete('message-1')).rejects.toThrow(
        'Delete failed',
      );
    });

    it('should handle invalid message ID format', async () => {
      (messagesService.delete as jest.Mock).mockRejectedValue(
        new Error('Invalid ID format'),
      );

      await expect(controller.delete('invalid')).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });
});
