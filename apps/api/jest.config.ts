import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    'src/main.ts',
    'src/.*\\.module\\.ts',
    'src/database/migrations/',
    'src/database/seeds/',
    'src/database/data-source.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  // Exclude E2E tests from unit test runs
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/e2e/',
  ],
};

export default config;
