import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadMigrationsFromDirectory,
  MissionRepository,
  ObservationSessionRepository,
  type ObservationSessionRecord,
  openHeadquartersDatabase,
  runMigrations,
} from './index';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-observation-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createSession(): ObservationSessionRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    missionId: '22222222-2222-4222-8222-222222222222',
    startedAt: '2026-06-28T20:00:00.000Z',
  };
}

describe('ObservationSessionRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('tracks an active observation session by mission id', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    new MissionRepository(database).save(createMission());
    const repository = new ObservationSessionRepository(database);
    const session = createSession();

    try {
      repository.start(session);

      expect(repository.findActiveByMissionId(session.missionId)).toEqual(session);
    } finally {
      database.close();
    }
  });

  it('stores observation completion and duration', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
    new MissionRepository(database).save(createMission());
    const repository = new ObservationSessionRepository(database);
    const session = createSession();
    const completedSession: ObservationSessionRecord = {
      ...session,
      completedAt: '2026-06-28T20:05:00.000Z',
      durationMs: 300000,
    };

    try {
      repository.start(session);
      repository.complete(completedSession);

      expect(repository.findById(session.id)).toEqual(completedSession);
      expect(repository.findActiveByMissionId(session.missionId)).toBeUndefined();
    } finally {
      database.close();
    }
  });

  it('keeps observation session migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('004_observation_sessions');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('004_observation_sessions');

    database.close();
  });
});

function createMission() {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    codename: 'Observation Mission',
    state: 'observation' as const,
    createdAt: '2026-06-28T19:59:00.000Z',
    updatedAt: '2026-06-28T20:00:00.000Z',
  };
}
