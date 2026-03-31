// Global test setup for API tests
import 'reflect-metadata';

// Set test environment variables (runs BEFORE test files are loaded)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MAIL_HOST = 'localhost';
process.env.MAIL_PORT = '1025';
process.env.MAIL_USER = 'test';
process.env.MAIL_PASSWORD = 'test';
process.env.MAIL_FROM = 'test@example.com';
process.env.LMSTUDIO_URL = 'http://localhost:1234';
process.env.LMSTUDIO_MODEL = 'local-model';

// Default database and Redis config for tests (will be overridden by testcontainers in beforeAll)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_DATABASE = 'test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Note: beforeAll/afterAll hooks are not available in setupFiles
// They should be used in individual test files instead
