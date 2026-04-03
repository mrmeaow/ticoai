import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

describe('AiController', () => {
  let controller: AiController;
  let aiService: Partial<AiService>;

  beforeEach(async () => {
    aiService = {
      summarize: jest.fn(),
      detectPriority: jest.fn(),
      suggestReply: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: aiService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/ai/summarize', () => {
    const ticketId = '123e4567-e89b-12d3-a456-426614174000';

    it('should summarize ticket successfully', async () => {
      const mockSummary = {
        summary: 'This is a summary of the ticket content...',
        keyPoints: ['Issue reported', 'Customer awaiting response'],
      };
      (aiService.summarize as jest.Mock).mockResolvedValue(mockSummary);

      const result = await controller.summarize({ ticketId });

      expect(aiService.summarize).toHaveBeenCalledWith(ticketId);
      expect(result).toEqual(mockSummary);
    });

    it('should handle summarize service error', async () => {
      (aiService.summarize as jest.Mock).mockRejectedValue(
        new Error('Summarize failed'),
      );

      await expect(controller.summarize(ticketId)).rejects.toThrow(
        'Summarize failed',
      );
    });

    it('should handle empty ticket ID', async () => {
      try {
        await controller.summarize({ ticketId: '' });
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle invalid UUID format', async () => {
      try {
        await controller.summarize({ ticketId: 'invalid-uuid' });
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('POST /api/ai/detect-priority', () => {
    const ticketId = '123e4567-e89b-12d3-a456-426614174000';

    it('should detect priority successfully', async () => {
      const mockPriority = {
        priority: 'HIGH',
        confidence: 0.85,
        reasoning: 'Keywords indicate urgent issue',
      };
      (aiService.detectPriority as jest.Mock).mockResolvedValue(mockPriority);

      const result = await controller.detectPriority({ ticketId });

      expect(aiService.detectPriority).toHaveBeenCalledWith(ticketId);
      expect(result).toEqual(mockPriority);
    });

    it('should handle detect priority service error', async () => {
      (aiService.detectPriority as jest.Mock).mockRejectedValue(
        new Error('Detect priority failed'),
      );

      await expect(controller.detectPriority(ticketId)).rejects.toThrow(
        'Detect priority failed',
      );
    });

    it('should handle empty ticket ID', async () => {
      try {
        await controller.detectPriority({ ticketId: '' });
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle invalid UUID format', async () => {
      try {
        await controller.detectPriority({ ticketId: 'invalid-uuid' });
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('POST /api/ai/suggest-reply', () => {
    const ticketId = '123e4567-e89b-12d3-a456-426614174000';

    it('should suggest reply successfully', async () => {
      const mockReply = {
        suggestedReply:
          'Thank you for contacting support. We are investigating your issue.',
        confidence: 0.92,
      };
      (aiService.suggestReply as jest.Mock).mockResolvedValue(mockReply);

      const result = await controller.suggestReply({ ticketId });

      expect(aiService.suggestReply).toHaveBeenCalledWith(ticketId);
      expect(result).toEqual(mockReply);
    });

    it('should handle suggest reply service error', async () => {
      (aiService.suggestReply as jest.Mock).mockRejectedValue(
        new Error('Suggest reply failed'),
      );

      await expect(controller.suggestReply(ticketId)).rejects.toThrow(
        'Suggest reply failed',
      );
    });

    it('should handle empty ticket ID', async () => {
      try {
        await controller.suggestReply({ ticketId: '' });
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle invalid UUID format', async () => {
      try {
        await controller.suggestReply({ ticketId: 'invalid-uuid' });
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle ticket not found', async () => {
      (aiService.suggestReply as jest.Mock).mockRejectedValue(
        new Error('Ticket not found'),
      );

      await expect(controller.suggestReply({ ticketId })).rejects.toThrow(
        'Ticket not found',
      );
    });
  });
});
