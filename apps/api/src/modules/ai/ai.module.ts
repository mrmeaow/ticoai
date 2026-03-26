import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { AiResult } from './entities/ai-result.entity';
import { AiProcessor } from './workers/ai.processor';
import { TicketsModule } from '../tickets/tickets.module';
import { MessagesModule } from '../messages/messages.module';
import { SseModule } from '../sse/sse.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AiResult]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string | undefined>('redis.password'),
        },
        prefix: configService.get<string>('queue.prefix', 'bull:ticoai'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'ai-jobs',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    TicketsModule,
    MessagesModule,
    SseModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiRepository, AiProcessor],
  exports: [AiService, BullModule],
})
export class AiModule {}
