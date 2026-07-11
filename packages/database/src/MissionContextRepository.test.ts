import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Mission } from '@headquarters/shared';
import {
  loadMigrationsFromDirectory,
  MissionContextRepository,
  MissionRepository,
  openHeadquartersDatabase,
  runMigrations,
} from './index';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-mission-context-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createMission(): Mission {
  return {
    id: 'mission-001',
    codename: 'Context Memory Mission',
    state: 'briefing',
    objective: 'Persist accepted mission intelligence',
    createdAt: '2026-07-11T10:00:00.000Z',
    updatedAt: '2026-07-11T10:00:00.000Z',
  };
}

describe('MissionContextRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists and replaces one mission context record by mission id', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    try {
      runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
      new MissionRepository(database).save(createMission());
      const repository = new MissionContextRepository(database);
      const first = {
        missionId: 'mission-001',
        contextJson: JSON.stringify({ briefing: { market: 'ES' } }),
        createdAt: '2026-07-11T10:00:00.000Z',
        updatedAt: '2026-07-11T10:00:00.000Z',
      };
      const second = {
        ...first,
        contextJson: JSON.stringify({ briefing: { market: 'NQ' } }),
        updatedAt: '2026-07-11T10:05:00.000Z',
      };

      repository.save(first);
      repository.save(second);

      expect(repository.findByMissionId(first.missionId)).toEqual(second);
      expect(repository.list()).toEqual([second]);
    } finally {
      database.close();
    }
  });

  it('keeps mission context migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('009_mission_context_records');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('009_mission_context_records');

    database.close();
  });
});
