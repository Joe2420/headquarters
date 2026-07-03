import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  JournalEntryRepository,
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  type PersistedJournalEntry,
  runMigrations,
} from './index';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-journal-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createEntry(): PersistedJournalEntry {
  return {
    id: 'journal-001',
    entryDate: '2026-07-02',
    rawContent: 'Protected capital and followed the rule.',
    rawMood: 'Calm',
    rawMarketConditions: 'Range day',
    source: 'manual',
    attachmentReferences: ['chart-001'],
    classificationStatus: 'unclassified',
    createdAt: '2026-07-02T08:00:00.000Z',
    updatedAt: '2026-07-02T08:00:00.000Z',
  };
}

describe('JournalEntryRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists and lists journal entries in chronological order', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    const repository = new JournalEntryRepository(database);
    const first = createEntry();
    const second: PersistedJournalEntry = {
      ...createEntry(),
      id: 'journal-002',
      entryDate: '2026-07-03',
      createdAt: '2026-07-03T08:00:00.000Z',
      updatedAt: '2026-07-03T08:00:00.000Z',
    };

    repository.save(second);
    repository.save(first);

    expect(repository.findById(first.id)).toEqual(first);
    expect(repository.list().map((entry) => entry.id)).toEqual([first.id, second.id]);

    database.close();
  });
});
