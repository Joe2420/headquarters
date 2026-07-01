import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createLocalDatabaseBackup } from './Backup';

const tempRoots: string[] = [];

describe('Local database backup', () => {
  afterEach(() => {
    while (tempRoots.length > 0) {
      const tempRoot = tempRoots.pop();
      if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('copies a local database file without mutating the source', () => {
    const tempRoot = createTempRoot();
    const sourcePath = join(tempRoot, 'headquarters.sqlite');
    const backupPath = join(tempRoot, 'backups', 'headquarters.backup.sqlite');
    const sourceContent = 'local database bytes';

    writeFileSync(sourcePath, sourceContent);

    const result = createLocalDatabaseBackup({
      sourcePath,
      backupPath,
      createdAt: '2026-07-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      sourcePath: resolve(sourcePath),
      backupPath: resolve(backupPath),
      createdAt: '2026-07-01T00:00:00.000Z',
      bytes: sourceContent.length,
      status: 'created',
    });
    expect(readFileSync(sourcePath, 'utf8')).toBe(sourceContent);
    expect(readFileSync(backupPath, 'utf8')).toBe(sourceContent);
  });

  it('rejects unsafe backup requests before writing output', () => {
    const tempRoot = createTempRoot();

    expect(() => createLocalDatabaseBackup({
      sourcePath: '',
      backupPath: join(tempRoot, 'backup.sqlite'),
    })).toThrow('Backup sourcePath is required');

    expect(() => createLocalDatabaseBackup({
      sourcePath: join(tempRoot, 'missing.sqlite'),
      backupPath: join(tempRoot, 'backup.sqlite'),
    })).toThrow('Backup source does not exist');
  });
});

function createTempRoot(): string {
  const tempRoot = mkdtempSync(join(tmpdir(), 'headquarters-backup-'));
  tempRoots.push(tempRoot);
  return tempRoot;
}
