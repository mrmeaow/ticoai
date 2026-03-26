import { Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AiRepository } from './ai.repository';
import { TicketsService } from '../tickets/tickets.service';
import { MessagesService } from '../messages/messages.service';
import { SseService } from '../sse/sse.service';
import { AiResult } from './entities/ai-result.entity';
import { AiJobType, AiJobStatus } from '@pkg/types';
import { randomUUID } from 'crypto';

export interface AiJobData {
  jobId: string;
  resultId: string;
  ticketId: string;
  type: AiJobType;
}

@Injectable()
export class AiService {
  constructor(
    @InjectQueue('ai-jobs') private readonly aiQueue: Queue,
    private readonly aiRepository: AiRepository,
    private readonly ticketsService: TicketsService,
    private readonly messagesService: MessagesService,
    private readonly sseService: SseService,
    private readonly configService: ConfigService,
  ) {}

  async summarize(ticketId: string): Promise<{ jobId: string; resultId: string }> {
    return this.enqueueAiJob(ticketId, AiJobType.SUMMARIZE);
  }

  async detectPriority(ticketId: string): Promise<{ jobId: string; resultId: string }> {
    return this.enqueueAiJob(ticketId, AiJobType.DETECT_PRIORITY);
  }

  async suggestReply(ticketId: string): Promise<{ jobId: string; resultId: string }> {
    return this.enqueueAiJob(ticketId, AiJobType.SUGGEST_REPLY);
  }

  private async enqueueAiJob(
    ticketId: string,
    type: AiJobType,
  ): Promise<{ jobId: string; resultId: string }> {
    const jobId = randomUUID();

    const ticket = await this.ticketsService.findById(ticketId);

    const aiResult = await this.aiRepository.create({
      jobId,
      jobType: type,
      status: AiJobStatus.PENDING,
      ticket,
    });

    await this.aiQueue.add('process-ai-job', {
      jobId,
      resultId: aiResult.id,
      ticketId,
      type,
    } as AiJobData, { jobId });

    return { jobId, resultId: aiResult.id };
  }

  async processAiJob(data: AiJobData): Promise<void> {
    const { jobId, resultId, ticketId, type } = data;

    try {
      await this.aiRepository.updateByJobId(jobId, { status: AiJobStatus.PROCESSING });

      const ticket = await this.ticketsService.findById(ticketId);
      const messages = await this.messagesService.findByTicketId(ticketId);

      const prompt = this.buildPrompt(type, ticket, messages);
      const result = await this.callLmStudio(prompt);

      await this.aiRepository.updateByJobId(jobId, {
        status: AiJobStatus.COMPLETED,
        result,
      });

      if (type === AiJobType.SUGGEST_REPLY) {
        await this.messagesService.createAiMessage(ticketId, result, jobId);
      }

      this.sseService.notify(jobId, {
        status: AiJobStatus.COMPLETED,
        result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.aiRepository.updateByJobId(jobId, {
        status: AiJobStatus.FAILED,
        error: errorMessage,
      });

      this.sseService.notify(jobId, {
        status: AiJobStatus.FAILED,
        error: errorMessage,
      });

      throw error;
    }
  }

  private buildPrompt(
    type: AiJobType,
    ticket: any,
    messages: any[],
  ): string {
    const systemPrompt = 'You are a helpful customer support assistant.';

    let userPrompt = '';

    switch (type) {
      case AiJobType.SUMMARIZE:
        userPrompt = `Summarize this support ticket in 2-3 sentences:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}\n\nConversation:\n${messages.map((m) => `[${m.role}] ${m.content}`).join('\n')}`;
        break;

      case AiJobType.DETECT_PRIORITY:
        userPrompt = `Analyze this support ticket and return exactly one priority level (LOW, MEDIUM, HIGH, or CRITICAL):\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}\n\nReturn only the priority level.`;
        break;

      case AiJobType.SUGGEST_REPLY:
        const recentMessages = messages.slice(-5);
        userPrompt = `Draft a helpful, professional reply (under 100 words) to this customer:\n\n${recentMessages.map((m) => `[${m.role}] ${m.content}`).join('\n')}`;
        break;
    }

    return `${systemPrompt}\n\n${userPrompt}`;
  }

  private async callLmStudio(prompt: string): Promise<string> {
    const lmStudioUrl = this.configService.get<string>('lmstudio.url', 'http://localhost:1234');
    const model = this.configService.get<string>('lmstudio.model', 'local-model');

    try {
      const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful customer support assistant.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException('LM Studio is unavailable');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      throw new ServiceUnavailableException('Failed to connect to LM Studio');
    }
  }
}
