import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDoctrineHistoryEntry, createDoctrineRecord } from '@headquarters/doctrine';
import { openHeadquartersDatabase } from './Database';
import { DoctrineHistoryRepository } from './DoctrineHistoryRepository';
import { DoctrineRepository } from './DoctrineRepository';
import { loadMigrationsFromDirectory, runMigrations } from './MigrationRunner';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-doctrine-history-'));
  tempDirs.push(directory);
  const database = openHeadquartersDatabase(join(directory, 'doctrine-history.sqlite'));
  runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
  return database;
}

describe('DoctrineHistoryRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('appends and lists doctrine history in deterministic order', () => {
    const database = createDatabase();

    try {
      const doctrineRepository = new DoctrineRepository(database);
      const historyRepository = new DoctrineHistoryRepository(database);
      const record = createDoctrineRecord({
        title: 'Wait for confirmation',
        summary: 'Wait for confirmation before entry.',
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
      }, {
        id: 'doctrine-001',
        now: '2026-01-01T00:00:00.000Z',
      });

      expect(record).toBeDefined();
      if (!record) return;

      doctrineRepository.save(record);
      const later = createDoctrineHistoryEntry(record, 'updated', {
        id: 'history-002',
        occurredAt: '2026-01-02T00:00:00.000Z',
      });
      const earlier = createDoctrineHistoryEntry(record, 'promoted', {
        id: 'history-001',
        occurredAt: '2026-01-01T00:00:00.000Z',
      });

      historyRepository.append(later);
      historyRepository.append(earlier);

      expect(historyRepository.list().map((entry) => entry.id)).toEqual(['history-001', 'history-002']);
      expect(historyRepository.listByDoctrineId('doctrine-001').map((entry) => entry.action)).toEqual([
        'promoted',
        'updated',
      ]);
    } finally {
      database.close();
    }
  });
});
