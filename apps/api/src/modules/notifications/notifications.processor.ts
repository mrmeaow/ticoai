import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { NotificationsService, NotificationData } from './notifications.service';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process()
  async processNotification(job: Job<NotificationData>): Promise<void> {
    try {
      await this.notificationsService.sendEmail(job.data);
      this.logger.log(`Email sent to ${job.data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}
