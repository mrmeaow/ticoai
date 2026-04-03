import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from './notifications.processor';
import {
  NotificationsService,
  NotificationData,
} from './notifications.service';

describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;
  let notificationsService: Partial<NotificationsService>;

  const mockJob = {
    id: 'job-123',
    data: {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      context: { key: 'value' },
    } as NotificationData,
    updateProgress: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined),
    attemptsMade: 0,
  } as unknown as Job<NotificationData>;

  beforeEach(async () => {
    notificationsService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProcessor,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    processor = module.get<NotificationsProcessor>(NotificationsProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processNotification', () => {
    it('should successfully process notification job', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await processor.processNotification(mockJob);

      expect(notificationsService.sendEmail).toHaveBeenCalledWith(mockJob.data);
      expect(notificationsService.sendEmail).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });

    it('should log successful email send', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      await processor.processNotification(mockJob);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Email sent to ${mockJob.data.to}`,
      );
      loggerSpy.mockRestore();
    });

    it('should handle email sending failure', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('SMTP Error'),
      );

      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        'SMTP Error',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send email'),
      );
      loggerSpy.mockRestore();
    });

    it('should propagate error after logging', async () => {
      const error = new Error('Connection refused');
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(error);

      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        error,
      );

      loggerSpy.mockRestore();
    });

    it('should handle template not found error', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('Template not found: ticket-assigned'),
      );

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        'Template not found: ticket-assigned',
      );
    });

    it('should handle invalid recipient error', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('Invalid recipient address'),
      );

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        'Invalid recipient address',
      );
    });

    it('should handle rate limit error', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('Rate limit exceeded. Please retry later.'),
      );

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        'Rate limit exceeded. Please retry later.',
      );
    });

    it('should handle SMTP connection error', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED - SMTP server not reachable'),
      );

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        'ECONNREFUSED - SMTP server not reachable',
      );
    });

    it('should handle authentication error', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('SMTP authentication failed'),
      );

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        'SMTP authentication failed',
      );
    });

    it('should handle empty job data gracefully', async () => {
      const emptyJob = {
        ...mockJob,
        data: {
          to: '',
          subject: '',
          template: '',
          context: {},
        } as NotificationData,
      };

      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('Invalid data'),
      );

      await expect(processor.processNotification(emptyJob)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  describe('retry handling', () => {
    it('should propagate errors for BullMQ retry mechanism', async () => {
      const transientError = new Error('Temporary connection issue');
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        transientError,
      );

      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const loggerLogSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      try {
        await processor.processNotification(mockJob);
      } catch (error) {
        expect(error).toEqual(transientError);
      }

      loggerErrorSpy.mockRestore();
      loggerLogSpy.mockRestore();
    });
  });

  describe('job data handling', () => {
    it('should process job with complete notification data', async () => {
      const completeJob = {
        ...mockJob,
        data: {
          to: 'user@example.com',
          subject: 'Complete Notification',
          template: 'complete-template',
          context: {
            ticketTitle: 'Test Ticket',
            agentName: 'Agent Smith',
            createdAt: new Date().toISOString(),
          },
        } as NotificationData,
      };

      await processor.processNotification(completeJob);

      expect(notificationsService.sendEmail).toHaveBeenCalledWith(
        completeJob.data,
      );
    });

    it('should process job with nested context', async () => {
      const nestedContextJob = {
        ...mockJob,
        data: {
          to: 'user@example.com',
          subject: 'Nested Context',
          template: 'nested-template',
          context: {
            user: {
              name: 'John Doe',
              email: 'john@example.com',
            },
            ticket: {
              id: 'ticket-123',
              title: 'Support Request',
              status: 'open',
            },
          },
        } as NotificationData,
      };

      await processor.processNotification(nestedContextJob);

      expect(notificationsService.sendEmail).toHaveBeenCalledWith(
        nestedContextJob.data,
      );
    });

    it('should handle job with special characters in data', async () => {
      const specialCharJob = {
        ...mockJob,
        data: {
          to: 'user@example.com',
          subject: 'Subject with special chars: àéïõü 中文',
          template: 'special-template',
          context: {
            message: 'Hello <script>alert("xss")</script>',
            name: "O'Connor",
          },
        } as NotificationData,
      };

      await processor.processNotification(specialCharJob);

      expect(notificationsService.sendEmail).toHaveBeenCalledWith(
        specialCharJob.data,
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle undefined error message', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error(),
      );

      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(processor.processNotification(mockJob)).rejects.toThrow(
        Error,
      );

      expect(loggerErrorSpy).toHaveBeenCalled();
      loggerErrorSpy.mockRestore();
    });

    it('should handle non-Error rejection', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        'String error',
      );

      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(processor.processNotification(mockJob)).rejects.toEqual(
        'String error',
      );

      loggerErrorSpy.mockRestore();
    });
  });

  describe('logging', () => {
    it('should log successful sends with correct format', async () => {
      const loggerLogSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      await processor.processNotification(mockJob);

      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Email sent to/),
      );
      loggerLogSpy.mockRestore();
    });

    it('should log failed sends with error message', async () => {
      (notificationsService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('Test error'),
      );

      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(processor.processNotification(mockJob)).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to send email/),
      );
      loggerErrorSpy.mockRestore();
    });
  });
});
