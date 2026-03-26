import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [ScheduleModule.forRoot(), TicketsModule],
  providers: [CronService],
})
export class CronModule {}
