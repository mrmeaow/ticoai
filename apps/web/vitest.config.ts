/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.e2e.spec.ts', 'node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.module.ts',
        '**/*.routes.ts',
        '**/*.config.ts',
        '**/environments/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@pkg/api-sdk': resolve(__dirname, '../../packages/api-sdk/src'),
      '@pkg/types': resolve(__dirname, '../../packages/types/src'),
    },
  },
});
