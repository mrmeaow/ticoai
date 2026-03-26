import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { AiService, AiJobData } from '../ai.service';

@Processor('ai-jobs')
export class AiProcessor {
  constructor(private readonly aiService: AiService) {}

  @Process()
  async processAiJob(job: Job<AiJobData>): Promise<void> {
    await this.aiService.processAiJob(job.data);
  }
}
