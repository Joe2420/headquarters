import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface LocalDatabaseBackupRequest {
  readonly sourcePath: string;
  readonly backupPath: string;
  readonly createdAt?: string;
}

export interface LocalDatabaseBackupResult {
  readonly sourcePath: string;
  readonly backupPath: string;
  readonly createdAt: string;
  readonly bytes: number;
  readonly status: 'created';
}

export function createLocalDatabaseBackup(request: LocalDatabaseBackupRequest): LocalDatabaseBackupResult {
  const sourcePath = resolveBackupPath(request.sourcePath, 'sourcePath');
  const backupPath = resolveBackupPath(request.backupPath, 'backupPath');

  if (!existsSync(sourcePath)) {
    throw new Error(`Backup source does not exist: ${sourcePath}`);
  }

  const sourceStat = statSync(sourcePath);
  if (!sourceStat.isFile()) {
    throw new Error(`Backup source must be a file: ${sourcePath}`);
  }

  mkdirSync(dirname(backupPath), { recursive: true });
  copyFileSync(sourcePath, backupPath);

  return {
    sourcePath,
    backupPath,
    createdAt: request.createdAt ?? new Date().toISOString(),
    bytes: statSync(backupPath).size,
    status: 'created',
  };
}

function resolveBackupPath(path: string, fieldName: string): string {
  const trimmed = path.trim();

  if (trimmed.length === 0) {
    throw new Error(`Backup ${fieldName} is required`);
  }

  return resolve(trimmed);
}
