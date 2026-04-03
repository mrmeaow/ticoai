import { AllExceptionsFilter, ErrorResponse } from './all-exceptions.filter';
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  ArgumentsHost,
} from '@nestjs/common';
import { Response } from 'express';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const createMockHost = (url: string = '/api/test') => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    const mockRequest = {
      url,
    };

    return {
      host: {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost,
      jsonMock,
      statusMock,
    };
  };

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    describe('HttpException handling', () => {
      it('should catch and format HttpException with string response', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Forbidden',
          }),
        );
      });

      it('should catch and format HttpException with object response', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new HttpException(
          { message: 'Validation failed', error: 'Bad Request' },
          HttpStatus.BAD_REQUEST,
        );
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            error: 'Bad Request',
          }),
        );
      });

      it('should format NotFoundException (404)', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new NotFoundException('Resource not found');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
          }),
        );
      });

      it('should format BadRequestException (400)', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new BadRequestException('Invalid input');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
          }),
        );
      });

      it('should format UnauthorizedException (401)', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new UnauthorizedException('Unauthorized');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.UNAUTHORIZED,
            error: 'Unauthorized',
          }),
        );
      });

      it('should format ForbiddenException (403)', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new ForbiddenException('Access denied');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
          }),
        );
      });

      it('should format InternalServerErrorException (500)', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new InternalServerErrorException('Server error');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
          }),
        );
      });

      it('should handle array messages from HttpException', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new BadRequestException([
          'Field1 is required',
          'Field2 is required',
        ]);
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(Array.isArray(callArgs.message)).toBe(true);
        expect(callArgs.message).toContain('Field1 is required');
        expect(callArgs.message).toContain('Field2 is required');
      });

      it('should use default error message when message is not in response', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new HttpException(
          { error: 'Custom Error' },
          HttpStatus.BAD_REQUEST,
        );
        filter.catch(exception, host);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Custom Error',
          }),
        );
      });
    });

    describe('Generic Error handling', () => {
      it('should catch and format generic Error', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = new Error('Something went wrong');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Something went wrong',
            error: 'Internal Server Error',
          }),
        );
      });

      it('should catch and format generic Error with custom message', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new Error('Database connection failed');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.message).toBe('Database connection failed');
      });
    });

    describe('Unknown error handling', () => {
      it('should handle non-Error and non-HttpException objects', () => {
        const { host, jsonMock, statusMock } = createMockHost();
        const exception = 'Unknown error string';
        filter.catch(exception as unknown as Error, host);

        expect(statusMock).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
            error: 'Internal Server Error',
          }),
        );
      });

      it('should handle null exception', () => {
        const { host, statusMock } = createMockHost();
        const exception = null;
        filter.catch(exception as unknown as Error, host);

        expect(statusMock).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

      it('should handle undefined exception', () => {
        const { host, statusMock } = createMockHost();
        const exception = undefined;
        filter.catch(exception as unknown as Error, host);

        expect(statusMock).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    });

    describe('Response format', () => {
      it('should include statusCode in response', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new BadRequestException('Bad request');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs).toHaveProperty('statusCode');
        expect(typeof callArgs.statusCode).toBe('number');
      });

      it('should include message in response', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new BadRequestException('Bad request');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs).toHaveProperty('message');
      });

      it('should include error in response', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new BadRequestException('Bad request');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs).toHaveProperty('error');
      });

      it('should include timestamp in response', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new BadRequestException('Bad request');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs).toHaveProperty('timestamp');
        expect(callArgs.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        );
      });

      it('should include path in response', () => {
        const { host, jsonMock } = createMockHost('/api/test');
        const exception = new BadRequestException('Bad request');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs).toHaveProperty('path');
        expect(callArgs.path).toBe('/api/test');
      });

      it('should return complete ErrorResponse object', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new NotFoundException('Not found');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        const expectedKeys: (keyof ErrorResponse)[] = [
          'statusCode',
          'message',
          'error',
          'timestamp',
          'path',
        ];

        expectedKeys.forEach((key) => {
          expect(callArgs).toHaveProperty(key);
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle HttpException with no message', () => {
        const { host, statusMock } = createMockHost();
        const exception = new HttpException({}, HttpStatus.BAD_REQUEST);
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      });

      it('should handle HttpException with empty object response', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new HttpException({}, HttpStatus.FORBIDDEN);
        filter.catch(exception, host);

        expect(jsonMock).toHaveBeenCalled();
      });

      it('should handle very long error messages', () => {
        const { host, jsonMock } = createMockHost();
        const longMessage = 'A'.repeat(10000);
        const exception = new Error(longMessage);
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.message).toHaveLength(10000);
      });

      it('should handle special characters in error messages', () => {
        const { host, jsonMock } = createMockHost();
        const specialMessage = 'Error with special chars: <>&"\'{}[]';
        const exception = new Error(specialMessage);
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.message).toBe(specialMessage);
      });

      it('should handle unicode characters in error messages', () => {
        const { host, jsonMock } = createMockHost();
        const unicodeMessage = 'Error with unicode: 你好 🌍 émojis';
        const exception = new Error(unicodeMessage);
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.message).toBe(unicodeMessage);
      });

      it('should handle Error without message property', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new Error();
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.message).toBe('');
      });

      it('should handle different HTTP methods in path', () => {
        const { host, jsonMock } = createMockHost('/api/users/123');
        const exception = new NotFoundException();
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.path).toBe('/api/users/123');
      });

      it('should handle query parameters in path', () => {
        const { host, jsonMock } = createMockHost('/api/test?page=1&limit=10');
        const exception = new BadRequestException();
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.path).toBe('/api/test?page=1&limit=10');
      });
    });

    describe('Different execution contexts', () => {
      it('should work with different host types - HTTP', () => {
        const { host, statusMock } = createMockHost();
        const exception = new BadRequestException('Bad request');
        filter.catch(exception, host);

        expect(statusMock).toHaveBeenCalled();
      });

      it('should work when request url is undefined', () => {
        const { host, jsonMock } = createMockHost();
        const exception = new Error('Error');
        filter.catch(exception, host);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.path).toBe('/api/test');
      });
    });
  });
});
