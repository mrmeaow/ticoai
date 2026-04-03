import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { MailerService } from '@nestjs-modules/mailer';
import {
  NotificationsService,
  NotificationData,
} from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mailerService: Partial<MailerService>;
  let notificationQueue: jest.Mocked<any>;

  const mockJob = {
    id: 'job-123',
    data: {} as NotificationData,
  };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    notificationQueue = {
      add: jest.fn().mockResolvedValue(mockJob),
      getJob: jest.fn(),
      addBulk: jest.fn().mockResolvedValue([mockJob]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: MailerService, useValue: mailerService },
        {
          provide: getQueueToken('notifications'),
          useValue: notificationQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTicketAssignedEmail', () => {
    it('should add ticket assigned email job to queue', async () => {
      const to = 'user@example.com';
      const ticketTitle = 'Test Ticket';
      const agentName = 'Agent Smith';

      await service.sendTicketAssignedEmail(to, ticketTitle, agentName);

      expect(notificationQueue.add).toHaveBeenCalledWith('send-email', {
        to,
        subject: `Ticket Assigned: ${ticketTitle}`,
        template: 'ticket-assigned',
        context: { ticketTitle, agentName },
      });
    });

    it('should handle queue errors gracefully', async () => {
      (notificationQueue.add as jest.Mock).mockRejectedValue(
        new Error('Queue connection failed'),
      );

      await expect(
        service.sendTicketAssignedEmail('user@example.com', 'Ticket', 'Agent'),
      ).rejects.toThrow('Queue connection failed');
    });
  });

  describe('sendTicketResolvedEmail', () => {
    it('should add ticket resolved email job to queue', async () => {
      const to = 'user@example.com';
      const ticketTitle = 'Resolved Ticket';

      await service.sendTicketResolvedEmail(to, ticketTitle);

      expect(notificationQueue.add).toHaveBeenCalledWith('send-email', {
        to,
        subject: `Ticket Resolved: ${ticketTitle}`,
        template: 'ticket-resolved',
        context: { ticketTitle },
      });
    });

    it('should throw error when queue add fails', async () => {
      (notificationQueue.add as jest.Mock).mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(
        service.sendTicketResolvedEmail('user@example.com', 'Ticket'),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('sendNewMessageEmail', () => {
    it('should add new message email job to queue with correct context', async () => {
      const to = 'user@example.com';
      const ticketTitle = 'Support Ticket';
      const senderName = 'John Doe';

      await service.sendNewMessageEmail(to, ticketTitle, senderName);

      expect(notificationQueue.add).toHaveBeenCalledWith('send-email', {
        to,
        subject: `New Message: ${ticketTitle}`,
        template: 'new-message',
        context: { ticketTitle, senderName },
      });
    });

    it('should handle empty sender name', async () => {
      const to = 'user@example.com';
      const ticketTitle = 'Support Ticket';
      const senderName = '';

      await service.sendNewMessageEmail(to, ticketTitle, senderName);

      expect(notificationQueue.add).toHaveBeenCalledWith('send-email', {
        to,
        subject: `New Message: ${ticketTitle}`,
        template: 'new-message',
        context: { ticketTitle, senderName },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email via MailerService', async () => {
      const notificationData: NotificationData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        template: 'test-template',
        context: { key: 'value' },
      };

      await service.sendEmail(notificationData);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        template: 'test-template',
        context: { key: 'value' },
      });
    });

    it('should handle MailerService errors', async () => {
      (mailerService.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      const notificationData: NotificationData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        template: 'test-template',
        context: {},
      };

      await expect(service.sendEmail(notificationData)).rejects.toThrow(
        'SMTP connection failed',
      );
    });

    it('should handle invalid template gracefully', async () => {
      (mailerService.sendMail as jest.Mock).mockRejectedValue(
        new Error('Template not found'),
      );

      const notificationData: NotificationData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        template: 'non-existent-template',
        context: {},
      };

      await expect(service.sendEmail(notificationData)).rejects.toThrow(
        'Template not found',
      );
    });

    it('should handle empty recipient', async () => {
      (mailerService.sendMail as jest.Mock).mockRejectedValue(
        new Error('Invalid recipient'),
      );

      const notificationData: NotificationData = {
        to: '',
        subject: 'Test Subject',
        template: 'test-template',
        context: {},
      };

      await expect(service.sendEmail(notificationData)).rejects.toThrow(
        'Invalid recipient',
      );
    });

    it('should handle rate limiting errors', async () => {
      (mailerService.sendMail as jest.Mock).mockRejectedValue(
        new Error('Rate limit exceeded'),
      );

      const notificationData: NotificationData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        template: 'test-template',
        context: {},
      };

      await expect(service.sendEmail(notificationData)).rejects.toThrow(
        'Rate limit exceeded',
      );
    });

    it('should handle context with special characters', async () => {
      (mailerService.sendMail as jest.Mock).mockResolvedValue(true);

      const notificationData: NotificationData = {
        to: 'recipient@example.com',
        subject: 'Test Subject with special chars: àéïõü',
        template: 'test-template',
        context: { name: 'José García', message: 'Hello <world> & goodbye' },
      };

      await service.sendEmail(notificationData);

      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('bulk notifications', () => {
    it('should handle multiple email sends in sequence', async () => {
      const notifications: NotificationData[] = [
        {
          to: 'user1@example.com',
          subject: 'Subject 1',
          template: 'template1',
          context: {},
        },
        {
          to: 'user2@example.com',
          subject: 'Subject 2',
          template: 'template2',
          context: {},
        },
      ];

      for (const notification of notifications) {
        await service.sendEmail(notification);
      }

      expect(mailerService.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should fail on first error in bulk', async () => {
      (mailerService.sendMail as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('SMTP error'));

      const notifications: NotificationData[] = [
        {
          to: 'user1@example.com',
          subject: 'Subject 1',
          template: 'template1',
          context: {},
        },
        {
          to: 'user2@example.com',
          subject: 'Subject 2',
          template: 'template2',
          context: {},
        },
      ];

      await expect(
        service.sendEmail(notifications[0]),
      ).resolves.toBeUndefined();
      await expect(service.sendEmail(notifications[1])).rejects.toThrow(
        'SMTP error',
      );
    });
  });

  describe('queue integration', () => {
    it('should add job to queue', async () => {
      await service.sendTicketAssignedEmail(
        'user@example.com',
        'Ticket',
        'Agent',
      );

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.any(Object),
      );
    });

    it('should preserve job data integrity', async () => {
      const data = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'test',
        context: { nested: { value: 'deep' } },
      };

      await service.sendEmail(data);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          template: 'test',
          context: { nested: { value: 'deep' } },
        }),
      );
    });
  });
});
