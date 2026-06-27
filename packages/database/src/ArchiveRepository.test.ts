import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { HQEvent } from '@headquarters/shared';
import {
  ArchiveRepository,
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from './index';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-archive-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createEvent(id: string, occurredAt: string): HQEvent<{ codename: string }> {
  return {
    id,
    type: 'mission.created',
    version: 1,
    occurredAt,
    source: 'MissionKernel',
    missionId: '33333333-3333-4333-8333-333333333333',
    correlationId: '44444444-4444-4444-8444-444444444444',
    priority: 'white',
    payload: {
      codename: `Archive ${id}`,
    },
  };
}

describe('ArchiveRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists and loads an event envelope by id', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    const repository = new ArchiveRepository(database);
    const event = createEvent('11111111-1111-4111-8111-111111111111', '2026-06-27T09:00:00.000Z');

    repository.append(event);

    expect(repository.findById(event.id)).toEqual(event);

    database.close();
  });

  it('lists persisted envelopes in append order', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    const repository = new ArchiveRepository(database);
    const first = createEvent('11111111-1111-4111-8111-111111111111', '2026-06-27T09:00:00.000Z');
    const second = createEvent('22222222-2222-4222-8222-222222222222', '2026-06-27T08:00:00.000Z');

    repository.append(first);
    repository.append(second);

    expect(repository.list().map((event) => event.id)).toEqual([first.id, second.id]);

    database.close();
  });

  it('rejects duplicate event ids', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    const repository = new ArchiveRepository(database);
    const event = createEvent('11111111-1111-4111-8111-111111111111', '2026-06-27T09:00:00.000Z');

    repository.append(event);

    expect(() => repository.append(event)).toThrow();

    database.close();
  });

  it('keeps archive event migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('002_archive_events');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('002_archive_events');

    database.close();
  });
});
