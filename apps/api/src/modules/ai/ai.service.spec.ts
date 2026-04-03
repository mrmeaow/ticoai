import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiRepository } from './ai.repository';
import { TicketsService } from '../tickets/tickets.service';
import { MessagesService } from '../messages/messages.service';
import { SseService } from '../sse/sse.service';
import { ConfigService } from '@nestjs/config';
import { AiJobType, AiJobStatus } from '@pkg/types';
import { BullModule, getQueueToken } from '@nestjs/bull';

describe('AiService', () => {
  let aiService: AiService;
  let aiRepository: Partial<AiRepository>;
  let ticketsService: Partial<TicketsService>;
  let messagesService: Partial<MessagesService>;
  let sseService: Partial<SseService>;
  let configService: Partial<ConfigService>;
  let aiQueue: any;

  const mockTicket = {
    id: 'ticket-uuid',
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'OPEN',
    priority: 'MEDIUM',
  };

  beforeEach(async () => {
    aiRepository = {
      create: jest.fn(),
      updateByJobId: jest.fn(),
    };

    ticketsService = {
      findById: jest.fn(),
    };

    messagesService = {
      createAiMessage: jest.fn(),
      findByTicketId: jest.fn(),
    };

    sseService = {
      notify: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    aiQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: 'ai-jobs',
        }),
      ],
      providers: [
        AiService,
        { provide: AiRepository, useValue: aiRepository },
        { provide: TicketsService, useValue: ticketsService },
        { provide: MessagesService, useValue: messagesService },
        { provide: SseService, useValue: sseService },
        { provide: ConfigService, useValue: configService },
      ],
    })
      .overrideProvider(getQueueToken('ai-jobs'))
      .useValue(aiQueue)
      .compile();

    aiService = module.get<AiService>(AiService);
  });

  describe('summarize', () => {
    it('should enqueue a summarize job', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      const result = await aiService.summarize('ticket-uuid');

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('resultId');
      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.SUMMARIZE,
          status: AiJobStatus.PENDING,
        }),
      );
      expect(sseService.notify).toHaveBeenCalledWith(expect.any(String), {
        status: 'pending',
      });
    });

    it('should create AI job result in repository with ticket object', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      await aiService.summarize('ticket-uuid');

      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.SUMMARIZE,
          ticket: mockTicket,
        }),
      );
    });

    it('should notify SSE with pending status', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      await aiService.summarize('ticket-uuid');

      expect(sseService.notify).toHaveBeenCalledTimes(1);
    });

    it('should add job to queue with process-ai-job name', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      await aiService.summarize('ticket-uuid');

      expect(aiQueue.add).toHaveBeenCalledWith(
        'process-ai-job',
        expect.objectContaining({
          type: AiJobType.SUMMARIZE,
        }),
        expect.any(Object),
      );
    });
  });

  describe('detectPriority', () => {
    it('should enqueue a detect priority job', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      const result = await aiService.detectPriority('ticket-uuid');

      expect(result).toHaveProperty('jobId');
      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.DETECT_PRIORITY,
        }),
      );
    });

    it('should add job to ai-queue with correct job type', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      await aiService.detectPriority('ticket-uuid');

      expect(aiQueue.add).toHaveBeenCalledWith(
        'process-ai-job',
        expect.objectContaining({
          type: AiJobType.DETECT_PRIORITY,
        }),
        expect.any(Object),
      );
    });
  });

  describe('suggestReply', () => {
    it('should enqueue a suggest reply job', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      const result = await aiService.suggestReply('ticket-uuid');

      expect(result).toHaveProperty('jobId');
      expect(aiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: AiJobType.SUGGEST_REPLY,
        }),
      );
    });

    it('should verify suggestReply job data structure', async () => {
      (ticketsService.findById as jest.Mock).mockResolvedValue(mockTicket);
      (aiRepository.create as jest.Mock).mockResolvedValue({ id: 'result-id' });
      (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job-id' });

      await aiService.suggestReply('ticket-uuid');

      expect(aiQueue.add).toHaveBeenCalledWith(
        'process-ai-job',
        expect.objectContaining({
          type: AiJobType.SUGGEST_REPLY,
        }),
        expect.any(Object),
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

    it('should include ticket description in summarize prompt', () => {
      const prompt = (aiService as any).buildPrompt(
        AiJobType.SUMMARIZE,
        mockTicket,
        [{ role: 'CUSTOMER', content: 'Help!' }],
      );

      expect(prompt).toContain(mockTicket.description);
    });

    it('should format messages correctly for suggest reply', () => {
      const messages = [
        { role: 'CUSTOMER', content: 'First message' },
        { role: 'AGENT', content: 'Agent response' },
      ];

      const prompt = (aiService as any).buildPrompt(
        AiJobType.SUGGEST_REPLY,
        mockTicket,
        messages,
      );

      expect(prompt).toContain('First message');
      expect(prompt).toContain('Agent response');
    });

    it('should include ticket title in summarize prompt', () => {
      const prompt = (aiService as any).buildPrompt(
        AiJobType.SUMMARIZE,
        mockTicket,
        [],
      );

      expect(prompt).toContain(mockTicket.title);
    });

    it('should include ticket priority in detect priority prompt', () => {
      const prompt = (aiService as any).buildPrompt(
        AiJobType.DETECT_PRIORITY,
        mockTicket,
        [],
      );

      expect(prompt).toContain(mockTicket.priority);
    });
  });
});
