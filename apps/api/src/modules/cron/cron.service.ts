import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketsService } from '../tickets/tickets.service';
import { TicketStatus } from '@pkg/types';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAutoCloseTickets(): Promise<void> {
    this.logger.log('Running auto-close cron job for resolved tickets...');

    try {
      const { tickets } = await this.ticketsService.findAll({
        status: TicketStatus.RESOLVED,
      });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const ticketsToClose = tickets.filter(
        (ticket) => new Date(ticket.updatedAt) < sevenDaysAgo,
      );

      for (const ticket of ticketsToClose) {
        await this.ticketsService.update(ticket.id, { status: TicketStatus.CLOSED });
        this.logger.log(`Auto-closed ticket ${ticket.id}`);
      }

      this.logger.log(`Auto-closed ${ticketsToClose.length} tickets`);
    } catch (error) {
      this.logger.error('Error in auto-close cron job', error);
    }
  }
}
