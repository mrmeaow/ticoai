import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e.spec.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['test/setup.ts'],
    testTimeout: 60_000, // E2E tests with Testcontainers need more time
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
