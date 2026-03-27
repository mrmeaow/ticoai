import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AiService } from './ai.service';
import { AiRepository } from './ai.repository';
import { TicketsService } from '../tickets/tickets.service';
import { MessagesService } from '../messages/messages.service';
import { SseService } from '../sse/sse.service';
import { ConfigService } from '@nestjs/config';
import { AiJobType, AiJobStatus } from '@pkg/types';

describe('AiService', () => {
  let aiService: AiService;
  let aiRepository: Partial<AiRepository>;
  let ticketsService: Partial<TicketsService>;
  let messagesService: Partial<MessagesService>;
  let sseService: Partial<SseService>;
  let configService: Partial<ConfigService>;

  const mockTicket = {
    id: 'ticket-uuid',
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'OPEN',
    priority: 'MEDIUM',
  };

  beforeEach(() => {
    aiRepository = {
      create: vi.fn(),
      updateByJobId: vi.fn(),
    };

    ticketsService = {
      findById: vi.fn(),
    };

    messagesService = {
      createAiMessage: vi.fn(),
    };

    sseService = {
      notify: vi.fn(),
    };

    configService = {
      get: vi.fn(),
    };

    aiService = new AiService(
      {} as any, // BullMQ queue mocked
      aiRepository as AiRepository,
      ticketsService as TicketsService,
      messagesService as MessagesService,
      sseService as SseService,
      configService as ConfigService,
    );
  });

  describe('summarize', () => {
    it('should enqueue a summarize job', async () => {
      (ticketsService.findById as vi.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as vi.Mock).mockResolvedValue({ id: 'result-id' });

      const result = await aiService.summarize('ticket-uuid');

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('resultId');
      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.SUMMARIZE,
          status: AiJobStatus.PENDING,
        }),
      );
      expect(sseService.notify).toHaveBeenCalledWith(expect.any(String), { status: 'pending' });
    });
  });

  describe('detectPriority', () => {
    it('should enqueue a detect priority job', async () => {
      (ticketsService.findById as vi.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as vi.Mock).mockResolvedValue({ id: 'result-id' });

      const result = await aiService.detectPriority('ticket-uuid');

      expect(result).toHaveProperty('jobId');
      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.DETECT_PRIORITY,
        }),
      );
    });
  });

  describe('suggestReply', () => {
    it('should enqueue a suggest reply job', async () => {
      (ticketsService.findById as vi.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as vi.Mock).mockResolvedValue({ id: 'result-id' });

      const result = await aiService.suggestReply('ticket-uuid');

      expect(result).toHaveProperty('jobId');
      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.SUGGEST_REPLY,
        }),
      );
    });
  });

  describe('buildPrompt', () => {
    it('should build summarize prompt', () => {
      const prompt = (aiService as any).buildPrompt(
        AiJobType.SUMMARIZE,
        mockTicket,
        [{ role: 'CUSTOMER', content: 'Help!' }],
      );

      expect(prompt).toContain('Summarize this support ticket');
      expect(prompt).toContain(mockTicket.title);
    });

    it('should build detect priority prompt', () => {
      const prompt = (aiService as any).buildPrompt(
        AiJobType.DETECT_PRIORITY,
        mockTicket,
        [],
      );

      expect(prompt).toContain('return exactly one priority level');
    });

    it('should build suggest reply prompt', () => {
      const messages = [
        { role: 'CUSTOMER', content: 'Issue 1' },
        { role: 'AGENT', content: 'Reply 1' },
        { role: 'CUSTOMER', content: 'Issue 2' },
      ];

      const prompt = (aiService as any).buildPrompt(
        AiJobType.SUGGEST_REPLY,
        mockTicket,
        messages,
      );

      expect(prompt).toContain('Draft a helpful, professional reply');
    });
  });
});
