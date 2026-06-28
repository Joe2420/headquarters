import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronSqliteBindingPath = path.join(
  desktopRoot,
  '.electron-native',
  'node_modules',
  'better-sqlite3',
  'build',
  'Release',
  'better_sqlite3.node',
);

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
env.HEADQUARTERS_ELECTRON_SQLITE_BINDING = electronSqliteBindingPath;

const child = spawn(electronPath, ['dist/main/main.cjs'], {
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
