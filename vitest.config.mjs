import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@headquarters/shared': resolve(rootDir, 'packages/shared/src/index.ts'),
      '@headquarters/hqos': resolve(rootDir, 'packages/hqos/src/index.ts'),
      '@headquarters/database': resolve(rootDir, 'packages/database/src/index.ts'),
      '@headquarters/journal': resolve(rootDir, 'packages/journal/src/index.ts'),
      '@headquarters/doctrine': resolve(rootDir, 'packages/doctrine/src/index.ts'),
      '@headquarters/academy': resolve(rootDir, 'packages/academy/src/index.ts'),
      '@headquarters/commander': resolve(rootDir, 'packages/commander/src/index.ts'),
      '@headquarters/archive-intelligence': resolve(rootDir, 'packages/archive-intelligence/src/index.ts'),
      '@headquarters/guardian': resolve(rootDir, 'packages/guardian/src/index.ts'),
      '@headquarters/ai-runtime': resolve(rootDir, 'packages/ai-runtime/src/index.ts'),
      '@headquarters/ui': resolve(rootDir, 'packages/ui/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/dist/**', '**/node_modules/**'],
  },
});
