import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { TicketsService } from '../tickets/tickets.service';
import { AiRepository } from '../ai/ai.repository';
import { TicketStatus } from '@pkg/types';

describe('CronService', () => {
  let service: CronService;
  let ticketsService: Partial<TicketsService>;
  let aiRepository: Partial<AiRepository>;

  beforeEach(async () => {
    ticketsService = {
      findAll: jest.fn(),
      update: jest.fn(),
    };

    aiRepository = {
      deleteFailedJobsOlderThan: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: TicketsService, useValue: ticketsService },
        { provide: AiRepository, useValue: aiRepository },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAutoCloseTickets', () => {
    it('should auto-close resolved tickets older than 7 days', async () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const mockTickets = {
        tickets: [
          {
            id: 'ticket-1',
            status: TicketStatus.RESOLVED,
            updatedAt: eightDaysAgo,
          },
          {
            id: 'ticket-2',
            status: TicketStatus.RESOLVED,
            updatedAt: fiveDaysAgo,
          },
        ],
        total: 2,
        hasMore: false,
      };

      (ticketsService.findAll as jest.Mock).mockResolvedValue(mockTickets);
      (ticketsService.update as jest.Mock).mockResolvedValue(undefined);

      await service.handleAutoCloseTickets();

      expect(ticketsService.findAll).toHaveBeenCalledWith({
        status: TicketStatus.RESOLVED,
      });
      expect(ticketsService.update).toHaveBeenCalledWith('ticket-1', {
        status: TicketStatus.CLOSED,
      });
      expect(ticketsService.update).not.toHaveBeenCalledWith(
        'ticket-2',
        expect.anything(),
      );
    });

    it('should handle empty tickets list', async () => {
      const mockTickets = {
        tickets: [],
        total: 0,
        hasMore: false,
      };

      (ticketsService.findAll as jest.Mock).mockResolvedValue(mockTickets);

      await service.handleAutoCloseTickets();

      expect(ticketsService.findAll).toHaveBeenCalled();
      expect(ticketsService.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (ticketsService.findAll as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.handleAutoCloseTickets()).resolves.not.toThrow();
    });
  });

  describe('handleCleanupFailedAiJobs', () => {
    it('should delete failed AI jobs older than 30 days', async () => {
      (aiRepository.deleteFailedJobsOlderThan as jest.Mock).mockResolvedValue(
        5,
      );

      await service.handleCleanupFailedAiJobs();

      expect(aiRepository.deleteFailedJobsOlderThan).toHaveBeenCalledWith(
        expect.any(Date),
      );
    });

    it('should handle zero deleted count', async () => {
      (aiRepository.deleteFailedJobsOlderThan as jest.Mock).mockResolvedValue(
        0,
      );

      await service.handleCleanupFailedAiJobs();

      expect(aiRepository.deleteFailedJobsOlderThan).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (aiRepository.deleteFailedJobsOlderThan as jest.Mock).mockRejectedValue(
        new Error('Cleanup error'),
      );

      await expect(service.handleCleanupFailedAiJobs()).resolves.not.toThrow();
    });
  });
});
