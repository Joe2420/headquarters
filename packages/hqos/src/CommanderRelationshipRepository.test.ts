import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { buildCommanderRelationshipSnapshot } from './CommanderRelationshipEngine';
import { CommanderRelationshipRepository } from './CommanderRelationshipRepository';

const tempDirs: string[] = [];
const migrationsDirectory = existsSync(join(process.cwd(), 'packages/database/migrations'))
  ? join(process.cwd(), 'packages/database/migrations')
  : join(process.cwd(), '../database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-relationship-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

describe('CommanderRelationshipRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('persists relationship snapshots and reloads them', () => {
    const path = createTempDatabasePath();
    const firstDatabase = openHeadquartersDatabase(path);
    runMigrations(firstDatabase, loadMigrationsFromDirectory(migrationsDirectory));
    const snapshot = createSnapshot('relationship:one', '2026-07-12T12:00:00.000Z', true);
    new CommanderRelationshipRepository(firstDatabase).saveSnapshot(snapshot);
    firstDatabase.close();

    const secondDatabase = openHeadquartersDatabase(path);
    try {
      runMigrations(secondDatabase, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new CommanderRelationshipRepository(secondDatabase);

      expect(repository.getSnapshotById(snapshot.snapshotId)).toEqual(snapshot);
      expect(repository.getLatestSnapshot(snapshot.operatorId)).toEqual(snapshot);
      expect(repository.listSnapshots(snapshot.operatorId)).toEqual([snapshot]);
      expect(repository.listHistory(snapshot.operatorId).map((entry) => entry.snapshotId)).toContain(snapshot.snapshotId);
    } finally {
      secondDatabase.close();
    }
  });

  it('records history when relationship dimensions change', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    try {
      runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new CommanderRelationshipRepository(database);
      const previous = createSnapshot('relationship:previous', '2026-07-12T11:00:00.000Z', false);
      const current = createSnapshot('relationship:current', '2026-07-12T12:00:00.000Z', true, previous);

      repository.saveSnapshot(previous);
      repository.saveSnapshot(current, previous);

      expect(repository.listHistory().some((entry) => entry.oldState !== entry.newState)).toBe(true);
    } finally {
      database.close();
    }
  });

  it('keeps commander relationship migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('012_commander_relationship_snapshots');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('012_commander_relationship_snapshots');

    database.close();
  });
});

function createSnapshot(
  snapshotId: string,
  evaluatedAt: string,
  complete: boolean,
  previousSnapshot = undefined as ReturnType<typeof buildCommanderRelationshipSnapshot> | undefined,
) {
  return buildCommanderRelationshipSnapshot({
    operatorId: 'operator',
    snapshotId,
    evaluatedAt,
    missionContexts: [{
      missionId: 'mission-1',
      briefingComplete: complete,
      observationComplete: complete,
      authorizationEvidencePresent: complete,
      invalidationPresent: complete,
      riskDeclared: complete,
      debriefComplete: complete,
    }],
    previousSnapshot,
  });
}
