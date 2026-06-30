import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@headquarters/academy': resolve(__dirname, '../../packages/academy/src/index.ts'),
      '@headquarters/archive-intelligence': resolve(__dirname, '../../packages/archive-intelligence/src/index.ts'),
      '@headquarters/database': resolve(__dirname, '../../packages/database/src/index.ts'),
      '@headquarters/doctrine': resolve(__dirname, '../../packages/doctrine/src/index.ts'),
      '@headquarters/guardian': resolve(__dirname, '../../packages/guardian/src/index.ts'),
      '@headquarters/hqos': resolve(__dirname, '../../packages/hqos/src/index.ts'),
      '@headquarters/journal': resolve(__dirname, '../../packages/journal/src/index.ts'),
      '@headquarters/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
  },
  server: { port: 5173 },
});
