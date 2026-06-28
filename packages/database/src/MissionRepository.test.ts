import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Mission } from '@headquarters/shared';
import {
  loadMigrationsFromDirectory,
  MissionRepository,
  openHeadquartersDatabase,
  runMigrations,
} from './index';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-mission-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createMission(): Mission {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    campaignId: '22222222-2222-4222-8222-222222222222',
    codename: 'Repository Mission',
    state: 'idle',
    objective: 'Verify persistence',
    createdAt: '2026-06-28T20:00:00.000Z',
    updatedAt: '2026-06-28T20:00:00.000Z',
  };
}

describe('MissionRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists and loads a mission record by id', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    const repository = new MissionRepository(database);
    const mission = createMission();

    repository.save(mission);

    expect(repository.findById(mission.id)).toEqual(mission);

    database.close();
  });

  it('updates an existing mission record state', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    const repository = new MissionRepository(database);
    const mission = createMission();
    const briefingMission: Mission = {
      ...mission,
      state: 'briefing',
      updatedAt: '2026-06-28T20:05:00.000Z',
    };

    repository.save(mission);
    repository.save(briefingMission);

    expect(repository.findById(mission.id)).toEqual(briefingMission);

    database.close();
  });

  it('keeps mission creation schema migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('003_mission_creation_fields');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('003_mission_creation_fields');

    database.close();
  });
});
