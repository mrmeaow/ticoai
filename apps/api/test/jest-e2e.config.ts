import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage-e2e',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  setupFiles: ['<rootDir>/setup.ts'], // Runs BEFORE test files are loaded
  testTimeout: 120000,
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  workerIdleMemoryLimit: '256MB', // Force worker restart to clear module cache
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
