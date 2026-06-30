import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDoctrineRecord } from '@headquarters/doctrine';
import { DoctrineRepository, openHeadquartersDatabase, runMigrations, type Migration } from './index';

const tempDirs: string[] = [];

const doctrineMigration: Migration = {
  version: '006_doctrine_records',
  sql: `
    CREATE TABLE IF NOT EXISTS doctrine_records (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      confidence TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_excerpt TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
};

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-doctrine-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

describe('DoctrineRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists and loads doctrine records by id', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, [doctrineMigration]);
    const repository = new DoctrineRepository(database);
    const record = createDoctrineRecord(
      {
        title: 'Wait for confirmation',
        summary: 'Do not enter before confirmation appears.',
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
      },
      {
        id: 'doctrine-001',
        now: '2026-01-01T00:00:00.000Z',
      },
    );

    if (record === undefined) throw new Error('Expected doctrine record');

    repository.save(record);

    expect(repository.getById('doctrine-001')).toEqual(record);

    database.close();
  });

  it('lists doctrine records in deterministic creation order', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, [doctrineMigration]);
    const repository = new DoctrineRepository(database);
    const first = createDoctrineRecord(
      {
        title: 'First rule',
        summary: 'First summary.',
        source: {
          sourceType: 'manual',
          sourceId: 'manual-001',
        },
      },
      {
        id: 'doctrine-001',
        now: '2026-01-01T00:00:00.000Z',
      },
    );
    const second = createDoctrineRecord(
      {
        title: 'Second rule',
        summary: 'Second summary.',
        source: {
          sourceType: 'trade_review',
          sourceId: 'trade-review-001',
        },
      },
      {
        id: 'doctrine-002',
        now: '2026-01-01T00:01:00.000Z',
      },
    );

    if (first === undefined || second === undefined) throw new Error('Expected doctrine records');

    repository.save(second);
    repository.save(first);

    expect(repository.list()).toEqual([first, second]);

    database.close();
  });
});
