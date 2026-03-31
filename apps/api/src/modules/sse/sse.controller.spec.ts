import { Test, TestingModule } from '@nestjs/testing';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { of } from 'rxjs';

describe('SseController', () => {
  let controller: SseController;
  let sseService: Partial<SseService>;

  beforeEach(async () => {
    sseService = {
      addClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        {
          provide: SseService,
          useValue: sseService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SseController>(SseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('streamJobResults', () => {
    it('should return SSE stream for job results', () => {
      const jobId = 'test-job-id';
      const mockStream = of({
        type: 'message',
        data: JSON.stringify({ status: 'pending' }),
      });

      (sseService.addClient as jest.Mock).mockReturnValue(mockStream);

      const result = controller.streamJobResults(jobId, 'test-token');

      expect(result).toBeDefined();
      expect(sseService.addClient).toHaveBeenCalledWith(jobId);
    });

    it('should handle different job statuses', (done) => {
      const jobId = 'test-job-id';
      const mockResults = [
        { status: 'pending' },
        { status: 'processing' },
        { status: 'completed', result: 'test result' },
      ];

      const mockStream = of(...mockResults);
      (sseService.addClient as jest.Mock).mockReturnValue(mockStream);

      const result = controller.streamJobResults(jobId, 'test-token');

      result.subscribe({
        next: (event) => {
          expect(event.type).toBe('message');
          expect(event.data).toBeDefined();
        },
        complete: done,
      });
    });
  });
});
