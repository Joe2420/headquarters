import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@headquarters/database': resolve(__dirname, '../../packages/database/src/index.ts'),
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
