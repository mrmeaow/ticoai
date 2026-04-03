import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';

export interface NotificationData {
  to: string;
  subject: string;
  template: string;
  context: any;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    private readonly mailerService: MailerService,
  ) {}

  async sendTicketAssignedEmail(
    to: string,
    ticketTitle: string,
    agentName: string,
  ): Promise<void> {
    await this.notificationQueue.add('send-email', {
      to,
      subject: `Ticket Assigned: ${ticketTitle}`,
      template: 'ticket-assigned',
      context: { ticketTitle, agentName },
    });
  }

  async sendTicketResolvedEmail(
    to: string,
    ticketTitle: string,
  ): Promise<void> {
    await this.notificationQueue.add('send-email', {
      to,
      subject: `Ticket Resolved: ${ticketTitle}`,
      template: 'ticket-resolved',
      context: { ticketTitle },
    });
  }

  async sendNewMessageEmail(
    to: string,
    ticketTitle: string,
    senderName: string,
  ): Promise<void> {
    await this.notificationQueue.add('send-email', {
      to,
      subject: `New Message: ${ticketTitle}`,
      template: 'new-message',
      context: { ticketTitle, senderName },
    });
  }

  async sendEmail(data: NotificationData): Promise<void> {
    await this.mailerService.sendMail({
      to: data.to,
      subject: data.subject,
      template: data.template,
      context: data.context,
    });
  }
}
