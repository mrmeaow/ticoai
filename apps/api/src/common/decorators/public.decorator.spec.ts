import { Public, PublicKey } from './public.decorator';
import { SetMetadata } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(
    () => (target: any, key: string, descriptor: PropertyDescriptor) =>
      descriptor,
  ),
}));

describe('Public Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public', () => {
    it('should be defined', () => {
      expect(Public).toBeDefined();
    });

    it('should call SetMetadata with PublicKey and true', () => {
      Public();

      expect(SetMetadata).toHaveBeenCalledWith(PublicKey, true);
    });

    it('should set the PublicKey to "public"', () => {
      expect(PublicKey).toBe('public');
    });

    it('should return a function that can be used as a decorator', () => {
      const decoratorFn = Public;
      expect(typeof decoratorFn).toBe('function');
    });
  });

  describe('PublicKey', () => {
    it('should export PublicKey constant', () => {
      expect(PublicKey).toBeDefined();
    });

    it('should have correct key value', () => {
      expect(PublicKey).toBe('public');
    });
  });

  describe('Decorator application', () => {
    it('should work as a method decorator', () => {
      class TestController {
        @Public()
        async getData() {
          return 'data';
        }
      }

      expect(TestController.prototype.getData).toBeDefined();
    });

    it('should work as a class decorator', () => {
      @Public()
      class TestController {
        async getData() {
          return 'data';
        }
      }

      expect(TestController).toBeDefined();
    });

    it('should set IS_PUBLIC_KEY metadata when applied', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      Public();

      expect(mockSetMetadata).toHaveBeenCalledWith('public', true);
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple decorator applications', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      class TestController {
        @Public()
        @Public()
        async getData() {
          return 'data';
        }
      }

      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
    });

    it('should always set true as value', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      Public();

      const callArgs = mockSetMetadata.mock.calls[0];
      expect(callArgs[1]).toBe(true);
    });
  });

  describe('Integration with Guards', () => {
    it('PublicKey should match expected key for guard reflection', () => {
      const expectedKey = 'public';
      expect(PublicKey).toBe(expectedKey);
    });

    it('should set boolean value for easy guard checking', () => {
      const mockSetMetadata = SetMetadata as jest.Mock;
      mockSetMetadata.mockClear();

      Public();

      const callArgs = mockSetMetadata.mock.calls[0];
      expect(typeof callArgs[1]).toBe('boolean');
      expect(callArgs[1]).toBe(true);
    });
  });
});
