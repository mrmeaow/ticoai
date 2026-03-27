import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { TicketsService } from '../tickets/tickets.service';
import { AiRepository } from '../ai/ai.repository';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let messagesRepository: Partial<MessagesRepository>;
  let ticketsService: Partial<TicketsService>;
  let aiRepository: Partial<AiRepository>;

  const mockMessage = {
    id: 'message-uuid',
    content: 'Test message content',
    role: 'CUSTOMER',
    sender: { id: 'user-id', name: 'Test User' },
    ticket: { id: 'ticket-uuid' },
    aiJob: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    messagesRepository = {
      findByTicketId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };

    ticketsService = {
      findById: vi.fn(),
    };

    aiRepository = {
      findByJobId: vi.fn(),
    };

    messagesService = new MessagesService(
      messagesRepository as MessagesRepository,
      ticketsService as TicketsService,
      aiRepository as AiRepository,
    );
  });

  describe('findByTicketId', () => {
    it('should return messages for a ticket', async () => {
      (messagesRepository.findByTicketId as vi.Mock).mockResolvedValue([mockMessage]);

      const result = await messagesService.findByTicketId('ticket-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMessage);
    });

    it('should return empty array if no messages', async () => {
      (messagesRepository.findByTicketId as vi.Mock).mockResolvedValue([]);

      const result = await messagesService.findByTicketId('ticket-uuid');

      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new message', async () => {
      (ticketsService.findById as vi.Mock).mockResolvedValue({ id: 'ticket-uuid' });
      (messagesRepository.create as vi.Mock).mockResolvedValue(mockMessage);

      const result = await messagesService.create('ticket-uuid', 'Test content', 'user-id', 'CUSTOMER');

      expect(result.content).toBe('Test content');
      expect(messagesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test content',
          senderId: 'user-id',
          ticketId: 'ticket-uuid',
          role: 'CUSTOMER',
        }),
      );
    });

    it('should throw if ticket not found', async () => {
      (ticketsService.findById as vi.Mock).mockResolvedValue(null);

      await expect(
        messagesService.create('non-existent-ticket', 'Test', 'user-id', 'CUSTOMER'),
      ).rejects.toThrow('Ticket not found');
    });
  });

  describe('createAiMessage', () => {
    it('should create an AI message', async () => {
      (ticketsService.findById as vi.Mock).mockResolvedValue({ id: 'ticket-uuid' });
      (aiRepository.findByJobId as vi.Mock).mockResolvedValue({ id: 'ai-result-id' });
      (messagesRepository.create as vi.Mock).mockResolvedValue({
        ...mockMessage,
        role: 'AI',
        aiJob: { id: 'ai-result-id' },
      });

      const result = await messagesService.createAiMessage('ticket-uuid', 'AI response', 'job-uuid');

      expect(result.role).toBe('AI');
      expect(messagesRepository.create).toHaveBeenCalled();
    });
  });

  describe('processAiJob', () => {
    it('should process AI job and create message', async () => {
      const mockAiResult = {
        id: 'ai-result-id',
        result: 'AI generated response',
        jobType: 'SUGGEST_REPLY',
      };

      (aiRepository.findByJobId as vi.Mock).mockResolvedValue(mockAiResult);
      (ticketsService.findById as vi.Mock).mockResolvedValue({ id: 'ticket-uuid' });
      (messagesRepository.create as vi.Mock).mockResolvedValue({
        ...mockMessage,
        content: 'AI generated response',
        role: 'AI',
      });

      const result = await messagesService.processAiJob('job-uuid');

      expect(result.content).toBe('AI generated response');
    });
  });
});
