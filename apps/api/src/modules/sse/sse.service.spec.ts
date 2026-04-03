import { Test, TestingModule } from '@nestjs/testing';
import { SseService, SseJobResult } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SseService],
    }).compile();

    service = module.get<SseService>(SseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addClient', () => {
    it('should add a new client and return observable', () => {
      const jobId = 'test-job-id';
      const observable = service.addClient(jobId);

      expect(observable).toBeDefined();
      expect(service.hasClient(jobId)).toBe(true);
      expect(service.getClientCount()).toBe(1);
    });

    it('should reuse existing client subscription', () => {
      const jobId = 'test-job-id';
      service.addClient(jobId);
      expect(service.getClientCount()).toBe(1);

      service.addClient(jobId);
      expect(service.getClientCount()).toBe(1);
    });
  });

  describe('removeClient', () => {
    it('should remove existing client', () => {
      const jobId = 'test-job-id';
      service.addClient(jobId);
      expect(service.hasClient(jobId)).toBe(true);

      service.removeClient(jobId);
      expect(service.hasClient(jobId)).toBe(false);
      expect(service.getClientCount()).toBe(0);
    });

    it('should handle removing non-existent client gracefully', () => {
      expect(() => service.removeClient('non-existent')).not.toThrow();
    });

    it('should auto-disconnect client after completion notification', async () => {
      const jobId = 'test-job-id';
      service.addClient(jobId);
      expect(service.hasClient(jobId)).toBe(true);

      service.notify(jobId, { status: 'completed', result: 'test result' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(service.hasClient(jobId)).toBe(false);
    });
  });

  describe('notify', () => {
    it('should notify client with pending status', (done) => {
      const jobId = 'test-job-id';
      const observable = service.addClient(jobId);

      observable.subscribe({
        next: (data: SseJobResult) => {
          expect(data.status).toBe('pending');
          service.removeClient(jobId);
          done();
        },
      });

      service.notify(jobId, { status: 'pending' });
    });

    it('should notify client with completed status', async () => {
      const jobId = 'test-job-id';
      const observable = service.addClient(jobId);
      const results: SseJobResult[] = [];

      const subscription = observable.subscribe({
        next: (data: SseJobResult) => {
          results.push(data);
        },
      });

      service.notify(jobId, { status: 'completed', result: 'test result' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('completed');
      expect(results[0].result).toBe('test result');
      expect(service.hasClient(jobId)).toBe(false);

      subscription.unsubscribe();
    });

    it('should notify client with failed status', async () => {
      const jobId = 'test-job-id';
      const observable = service.addClient(jobId);
      const results: SseJobResult[] = [];

      const subscription = observable.subscribe({
        next: (data: SseJobResult) => {
          results.push(data);
        },
      });

      service.notify(jobId, { status: 'failed', error: 'test error' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBe('test error');
      expect(service.hasClient(jobId)).toBe(false);

      subscription.unsubscribe();
    });

    it('should handle notify for non-existent client gracefully', () => {
      expect(() =>
        service.notify('non-existent', { status: 'pending' }),
      ).not.toThrow();
    });

    it('should notify with processing status without disconnecting', async () => {
      const jobId = 'test-job-id';
      const observable = service.addClient(jobId);
      const results: SseJobResult[] = [];

      const subscription = observable.subscribe({
        next: (data: SseJobResult) => {
          results.push(data);
        },
      });

      service.notify(jobId, { status: 'processing' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('processing');
      expect(service.hasClient(jobId)).toBe(true);

      service.removeClient(jobId);
      subscription.unsubscribe();
    });
  });

  describe('hasClient', () => {
    it('should return true for existing client', () => {
      const jobId = 'test-job-id';
      service.addClient(jobId);
      expect(service.hasClient(jobId)).toBe(true);
    });

    it('should return false for non-existent client', () => {
      expect(service.hasClient('non-existent')).toBe(false);
    });

    it('should return true for client after concurrent reuse', () => {
      const jobId = 'test-job-id';
      service.addClient(jobId);
      service.removeClient(jobId);
      service.addClient(jobId);
      expect(service.hasClient(jobId)).toBe(true);
    });
  });

  describe('getClientCount', () => {
    it('should return 0 when no clients', () => {
      expect(service.getClientCount()).toBe(0);
    });

    it('should return 1 with single client', () => {
      service.addClient('job-1');
      expect(service.getClientCount()).toBe(1);
    });

    it('should return correct count with multiple clients', () => {
      service.addClient('job-1');
      service.addClient('job-2');
      service.addClient('job-3');
      expect(service.getClientCount()).toBe(3);
    });

    it('should update count after removing client', () => {
      service.addClient('job-1');
      service.addClient('job-2');
      expect(service.getClientCount()).toBe(2);

      service.removeClient('job-1');
      expect(service.getClientCount()).toBe(1);
    });

    it('should return correct count after concurrent reuse', () => {
      service.addClient('job-1');
      service.removeClient('job-1');
      service.addClient('job-1');
      service.addClient('job-2');
      expect(service.getClientCount()).toBe(2);
    });
  });

  describe('Concurrent client reuse', () => {
    it('should handle multiple clients with same jobId', () => {
      const jobId = 'test-job-id';
      service.addClient(jobId);
      expect(service.getClientCount()).toBe(1);

      service.addClient(jobId);
      expect(service.getClientCount()).toBe(1);
    });

    it('should handle rapid add/remove cycles', () => {
      const jobId = 'test-job-id';

      service.addClient(jobId);
      expect(service.getClientCount()).toBe(1);

      service.removeClient(jobId);
      expect(service.getClientCount()).toBe(0);

      service.addClient(jobId);
      expect(service.getClientCount()).toBe(1);

      service.removeClient(jobId);
      expect(service.getClientCount()).toBe(0);
    });

    it('should handle multiple distinct clients with interleaved lifecycle', () => {
      service.addClient('job-1');
      service.addClient('job-2');
      expect(service.getClientCount()).toBe(2);

      service.removeClient('job-1');
      expect(service.getClientCount()).toBe(1);

      service.addClient('job-3');
      expect(service.getClientCount()).toBe(2);

      service.removeClient('job-2');
      expect(service.getClientCount()).toBe(1);

      service.removeClient('job-3');
      expect(service.getClientCount()).toBe(0);
    });
  });
});
