import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiResult } from './entities/ai-result.entity';
import { AiJobType, AiJobStatus } from '@pkg/types';

@Injectable()
export class AiRepository {
  constructor(
    @InjectRepository(AiResult)
    private readonly aiResultRepository: Repository<AiResult>,
  ) {}

  async findById(id: string): Promise<AiResult | null> {
    return this.aiResultRepository.findOne({
      where: { id },
      relations: ['ticket'],
    });
  }

  async findByJobId(jobId: string): Promise<AiResult | null> {
    return this.aiResultRepository.findOne({
      where: { jobId },
      relations: ['ticket'],
    });
  }

  async findByTicketId(ticketId: string): Promise<AiResult[]> {
    return this.aiResultRepository.find({
      where: { ticket: { id: ticketId } },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<AiResult>): Promise<AiResult> {
    const result = this.aiResultRepository.create(data);
    return this.aiResultRepository.save(result);
  }

  async update(id: string, data: Partial<AiResult>): Promise<AiResult | null> {
    await this.aiResultRepository.update(id, data);
    return this.findById(id);
  }

  async updateByJobId(
    jobId: string,
    data: Partial<AiResult>,
  ): Promise<AiResult | null> {
    const result = await this.findByJobId(jobId);
    if (!result) return null;
    return this.update(result.id, data);
  }

  async deleteFailedJobsOlderThan(date: Date): Promise<number> {
    const result = await this.aiResultRepository
      .createQueryBuilder()
      .delete()
      .from(AiResult)
      .where('status = :status', { status: AiJobStatus.FAILED })
      .andWhere('createdAt < :date', { date })
      .execute();

    return result.affected || 0;
  }
}
