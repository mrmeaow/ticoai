import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { TicketsService } from '../tickets/tickets.service';
import { UsersService } from '../users/users.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let messagesRepository: Partial<MessagesRepository>;
  let ticketsService: Partial<TicketsService>;
  let usersService: Partial<UsersService>;

  const mockMessage = {
    id: 'message-uuid',
    content: 'Test message content',
    role: 'CUSTOMER',
    sender: { id: 'user-id', name: 'Test User' },
    ticket: { id: 'ticket-uuid' },
    aiJob: null,
    createdAt: new Date(),
  };

  const mockTicket = { id: 'ticket-uuid', title: 'Test', description: 'Test' };
  const mockSender = { id: 'user-id', name: 'Test User' };

  beforeEach(async () => {
    messagesRepository = {
      findByTicketId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    ticketsService = {
      findById: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessagesRepository, useValue: messagesRepository },
        { provide: TicketsService, useValue: ticketsService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    messagesService = module.get<MessagesService>(MessagesService);
  });

  describe('findByTicketId', () => {
    it('should return messages for a ticket', async () => {
      (messagesRepository.findByTicketId as jest.Mock).mockResolvedValue([
        mockMessage,
      ]);

      const result = await messagesService.findByTicketId('ticket-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMessage);
    });

    it('should return empty array if no messages', async () => {
      (messagesRepository.findByTicketId as jest.Mock).mockResolvedValue([]);

      const result = await messagesService.findByTicketId('ticket-uuid');

      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new message', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (usersService.findById as jest.Mock).mockResolvedValue(mockSender);
      (messagesRepository.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await messagesService.create({
        ticketId: 'ticket-uuid',
        content: 'Test message content',
        senderId: 'user-id',
        role: 'CUSTOMER',
      });

      expect(result.content).toBe('Test message content');
      expect(messagesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test message content',
          sender: mockSender,
          role: 'CUSTOMER',
        }),
      );
    });

    it('should throw if ticket not found', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        messagesService.create({
          ticketId: 'non-existent-ticket',
          content: 'Test',
          senderId: 'user-id',
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow('not found');
    });

    it('should throw if sender not found', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        messagesService.create({
          ticketId: 'ticket-uuid',
          content: 'Test',
          senderId: 'user-id',
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow('Sender not found');
    });
  });

  describe('createAiMessage', () => {
    it('should create an AI message', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (messagesRepository.create as jest.Mock).mockResolvedValue({
        ...mockMessage,
        role: 'AI',
        aiJob: { id: 'ai-result-id' },
      });

      const result = await messagesService.createAiMessage(
        'ticket-uuid',
        'AI response',
        'job-uuid',
      );

      expect(result.role).toBe('AI');
      expect(messagesRepository.create).toHaveBeenCalled();
    });
  });
});
