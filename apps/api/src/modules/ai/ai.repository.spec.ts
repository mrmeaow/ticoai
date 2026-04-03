import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AiRepository } from './ai.repository';
import { AiResult } from './entities/ai-result.entity';
import { AiJobType, AiJobStatus } from '@pkg/types';

describe('AiRepository', () => {
  let repository: AiRepository;
  let mockRepository: Partial<Repository<AiResult>>;
  let mockQueryBuilder: Partial<SelectQueryBuilder<AiResult>>;

  const mockAiResult: AiResult = {
    id: 'ai-result-uuid-1',
    jobType: AiJobType.CLASSIFICATION,
    status: AiJobStatus.COMPLETED,
    result: 'Test result',
    error: null,
    jobId: 'job-uuid-1',
    ticket: { id: 'ticket-uuid-1' } as any,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAiResult2: AiResult = {
    id: 'ai-result-uuid-2',
    jobType: AiJobType.SUMMARIZATION,
    status: AiJobStatus.PENDING,
    result: null,
    error: null,
    jobId: 'job-uuid-2',
    ticket: { id: 'ticket-uuid-1' } as any,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRepository,
        {
          provide: getRepositoryToken(AiResult),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<AiRepository>(AiRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return an AI result when found with relations', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockAiResult);

      const result = await repository.findById('ai-result-uuid-1');

      expect(result).toEqual(mockAiResult);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ai-result-uuid-1' },
        relations: ['ticket'],
      });
    });

    it('should return null when AI result not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include ticket relation', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockAiResult);

      await repository.findById('ai-result-uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['ticket'],
        }),
      );
    });
  });

  describe('findByJobId', () => {
    it('should return an AI result by jobId', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockAiResult);

      const result = await repository.findByJobId('job-uuid-1');

      expect(result).toEqual(mockAiResult);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { jobId: 'job-uuid-1' },
        relations: ['ticket'],
      });
    });

    it('should return null when no result found for jobId', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByJobId('non-existent-job');

      expect(result).toBeNull();
    });

    it('should include ticket relation', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockAiResult);

      await repository.findByJobId('job-uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['ticket'],
        }),
      );
    });
  });

  describe('findByTicketId', () => {
    it('should return AI results for a ticket', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([
        mockAiResult,
        mockAiResult2,
      ]);

      const result = await repository.findByTicketId('ticket-uuid-1');

      expect(result).toEqual([mockAiResult, mockAiResult2]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { ticket: { id: 'ticket-uuid-1' } },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no results found', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByTicketId('non-existent-ticket');

      expect(result).toEqual([]);
    });

    it('should order by createdAt DESC', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([
        mockAiResult2,
        mockAiResult,
      ]);

      await repository.findByTicketId('ticket-uuid-1');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create and return a new AI result', async () => {
      const aiResultData = {
        jobType: AiJobType.CLASSIFICATION,
        jobId: 'new-job-uuid',
        status: AiJobStatus.PENDING,
        ticket: { id: 'ticket-uuid-1' } as any,
      };
      const createdResult = { ...mockAiResult, ...aiResultData };

      (mockRepository.create as jest.Mock).mockReturnValue(createdResult);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdResult);

      const result = await repository.create(aiResultData);

      expect(mockRepository.create).toHaveBeenCalledWith(aiResultData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdResult);
      expect(result).toEqual(createdResult);
    });
  });

  describe('update', () => {
    it('should update and return the AI result', async () => {
      const updateData = {
        status: AiJobStatus.COMPLETED,
        result: 'Updated result',
      };
      const updatedResult = { ...mockAiResult, ...updateData };

      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(updatedResult);

      const result = await repository.update('ai-result-uuid-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'ai-result-uuid-1',
        updateData,
      );
      expect(result).toEqual(updatedResult);
    });

    it('should return null when AI result not found', async () => {
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 0 });
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.update('non-existent-id', {
        status: AiJobStatus.COMPLETED,
      });

      expect(result).toBeNull();
    });
  });

  describe('updateByJobId', () => {
    it('should update AI result by jobId and return updated result', async () => {
      const updateData = { status: AiJobStatus.COMPLETED };
      const updatedResult = { ...mockAiResult, ...updateData };

      (mockRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAiResult)
        .mockResolvedValueOnce(updatedResult);
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await repository.updateByJobId('job-uuid-1', updateData);

      expect(result).toEqual(updatedResult);
    });

    it('should return null when job not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.updateByJobId('non-existent-job', {
        status: AiJobStatus.COMPLETED,
      });

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFailedJobsOlderThan', () => {
    it('should delete failed jobs older than specified date', async () => {
      const testDate = new Date('2024-01-01');
      (mockQueryBuilder.execute as jest.Mock).mockResolvedValue({
        affected: 5,
      });

      const result = await repository.deleteFailedJobsOlderThan(testDate);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(AiResult);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('status = :status', {
        status: AiJobStatus.FAILED,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'createdAt < :date',
        { date: testDate },
      );
      expect(result).toBe(5);
    });

    it('should return 0 when no jobs are deleted', async () => {
      const testDate = new Date('2024-01-01');
      (mockQueryBuilder.execute as jest.Mock).mockResolvedValue({
        affected: 0,
      });

      const result = await repository.deleteFailedJobsOlderThan(testDate);

      expect(result).toBe(0);
    });

    it('should use query builder to delete failed jobs', async () => {
      const testDate = new Date();
      (mockQueryBuilder.execute as jest.Mock).mockResolvedValue({
        affected: 0,
      });

      await repository.deleteFailedJobsOlderThan(testDate);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
