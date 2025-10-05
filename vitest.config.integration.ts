/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup-integration.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'supabase/edge/**/*.ts',
        'apps/web/src/lib/**/*.ts',
        'apps/web/src/pages/api/**/*.ts'
      ],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    pool: 'forks', // Isolated processes for integration tests
    poolOptions: {
      forks: {
        singleFork: true // Use single process for database consistency
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@coiffeur/ui': path.resolve(__dirname, './packages/ui/src'),
      '@coiffeur/types': path.resolve(__dirname, './packages/types/src')
    }
  }
})