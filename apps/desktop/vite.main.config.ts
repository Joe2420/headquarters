import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const external = ['electron', ...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)];

export default defineConfig({
  define: {
    'process.env': 'process.env',
  },
  resolve: {
    alias: {
      'better-sqlite3': resolve(__dirname, 'src/main/betterSqlite3.ts'),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist/main',
    rollupOptions: {
      external,
      input: {
        main: resolve(__dirname, 'src/main/main.ts'),
        preload: resolve(__dirname, 'src/main/preload.ts'),
      },
      output: {
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    },
    target: 'node20',
  },
});
