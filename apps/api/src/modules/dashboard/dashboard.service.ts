import { Injectable } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class DashboardService {
  constructor(private readonly ticketsService: TicketsService) {}

  async getStats(userId: string, isAdmin: boolean) {
    return this.ticketsService.getStats(userId, isAdmin);
  }
}
