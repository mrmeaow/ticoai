import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { TicketsModule } from '../tickets/tickets.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ScheduleModule.forRoot(), TicketsModule, AiModule],
  providers: [CronService],
})
export class CronModule {}
