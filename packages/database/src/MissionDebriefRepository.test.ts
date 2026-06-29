import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadMigrationsFromDirectory,
  MissionDebriefRepository,
  MissionRepository,
  type MissionDebriefRecord,
  openHeadquartersDatabase,
  runMigrations,
} from './index';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-debrief-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createDebrief(): MissionDebriefRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    missionId: '22222222-2222-4222-8222-222222222222',
    behaviorSummary: 'Stayed patient through the close.',
    disciplineNotes: 'Followed the stop plan.',
    lesson: 'Write invalidation before deployment.',
    createdAt: '2026-06-28T20:10:00.000Z',
  };
}

describe('MissionDebriefRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists and loads a behavior-first mission debrief by mission id', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    new MissionRepository(database).save(createMission());
    const repository = new MissionDebriefRepository(database);
    const debrief = createDebrief();

    try {
      repository.save(debrief);

      expect(repository.findByMissionId(debrief.missionId)).toEqual(debrief);
    } finally {
      database.close();
    }
  });

  it('keeps debrief migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('005_mission_debriefs');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('005_mission_debriefs');

    database.close();
  });
});

function createMission() {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    codename: 'Debrief Mission',
    state: 'return_to_base' as const,
    createdAt: '2026-06-28T19:59:00.000Z',
    updatedAt: '2026-06-28T20:00:00.000Z',
  };
}
