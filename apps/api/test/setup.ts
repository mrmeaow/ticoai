// Global test setup for API tests
import { beforeAll, afterAll, vi } from 'vitest';

// Mock console.error in tests to reduce noise
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
