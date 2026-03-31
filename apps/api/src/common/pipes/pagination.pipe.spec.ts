import { PaginationPipe, PaginationParams } from './pagination.pipe';
import { BadRequestException } from '@nestjs/common';

describe('PaginationPipe', () => {
  let pipe: PaginationPipe;

  beforeEach(() => {
    pipe = new PaginationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should return default pagination values when not provided', () => {
      const result = pipe.transform({}, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should return valid page and limit when provided', () => {
      const result = pipe.transform({ page: 5, limit: 50 }, { type: 'query' });
      expect(result).toEqual({ page: 5, limit: 50 });
    });

    it('should set page to 1 when page is 0', () => {
      const result = pipe.transform({ page: 0 }, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should set page to 1 when page is negative', () => {
      const result = pipe.transform({ page: -5 }, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should cap limit to 100 when exceeded', () => {
      const result = pipe.transform({ limit: 500 }, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 100 });
    });

    it('should set limit to 20 (default) when limit is 0', () => {
      const result = pipe.transform({ limit: 0 }, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should set limit to 1 when limit is negative', () => {
      const result = pipe.transform({ limit: -10 }, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 1 });
    });

    it('should handle string values', () => {
      const result = pipe.transform(
        { page: '3' as any, limit: '25' as any },
        { type: 'query' },
      );
      expect(result).toEqual({ page: 3, limit: 25 });
    });

    it('should handle page only', () => {
      const result = pipe.transform({ page: 10 }, { type: 'query' });
      expect(result).toEqual({ page: 10, limit: 20 });
    });

    it('should handle limit only', () => {
      const result = pipe.transform({ limit: 50 }, { type: 'query' });
      expect(result).toEqual({ page: 1, limit: 50 });
    });
  });
});
