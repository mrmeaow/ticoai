import { ParseUUIDPipe } from './parse-uuid.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe;

  beforeEach(() => {
    pipe = new ParseUUIDPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should return valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const result = pipe.transform(validUUID, { type: 'param' });
      expect(result).toBe(validUUID);
    });

    it('should return valid UUID with uppercase', () => {
      const validUUID = '550E8400-E29B-41D4-A716-446655440000';
      const result = pipe.transform(validUUID, { type: 'param' });
      expect(result).toBe(validUUID);
    });

    it('should throw BadRequestException for invalid UUID - empty string', () => {
      expect(() => pipe.transform('', { type: 'param' })).toThrow(
        new BadRequestException('Invalid UUID format: '),
      );
    });

    it('should throw BadRequestException for invalid UUID - random string', () => {
      expect(() => pipe.transform('not-a-uuid', { type: 'param' })).toThrow(
        new BadRequestException('Invalid UUID format: not-a-uuid'),
      );
    });

    it('should throw BadRequestException for invalid UUID - wrong format', () => {
      expect(() =>
        pipe.transform('12345678-1234-1234-1234-123456789', { type: 'param' }),
      ).toThrow(
        new BadRequestException(
          'Invalid UUID format: 12345678-1234-1234-1234-123456789',
        ),
      );
    });

    it('should throw BadRequestException for null', () => {
      expect(() => pipe.transform(null as any, { type: 'param' })).toThrow(
        new BadRequestException('Invalid UUID format: null'),
      );
    });

    it('should throw BadRequestException for undefined', () => {
      expect(() => pipe.transform(undefined as any, { type: 'param' })).toThrow(
        new BadRequestException('Invalid UUID format: undefined'),
      );
    });
  });
});
