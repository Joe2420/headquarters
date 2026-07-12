import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { buildInstitutionalHealthSnapshot } from './InstitutionalHealthEngine';
import { InstitutionalHealthRepository } from './InstitutionalHealthRepository';

const tempDirs: string[] = [];
const migrationsDirectory = existsSync(join(process.cwd(), 'packages/database/migrations'))
  ? join(process.cwd(), 'packages/database/migrations')
  : join(process.cwd(), '../database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-health-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

describe('InstitutionalHealthRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('persists snapshots and history after reopening', () => {
    const path = createTempDatabasePath();
    const firstDatabase = openHeadquartersDatabase(path);
    runMigrations(firstDatabase, loadMigrationsFromDirectory(migrationsDirectory));
    const snapshot = createSnapshot('health:one', '2026-07-12T12:00:00.000Z', 'secure');
    new InstitutionalHealthRepository(firstDatabase).saveSnapshot(snapshot);
    firstDatabase.close();

    const secondDatabase = openHeadquartersDatabase(path);
    try {
      runMigrations(secondDatabase, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new InstitutionalHealthRepository(secondDatabase);

      expect(repository.getSnapshotById(snapshot.snapshotId)).toEqual(snapshot);
      expect(repository.getLatestSnapshot()).toEqual(snapshot);
      expect(repository.listSnapshots()).toEqual([snapshot]);
      expect(repository.listHistory().map((entry) => entry.snapshotId)).toContain(snapshot.snapshotId);
    } finally {
      secondDatabase.close();
    }
  });

  it('records changed dimensions between snapshots', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    try {
      runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new InstitutionalHealthRepository(database);
      const previous = createSnapshot('health:previous', '2026-07-12T11:00:00.000Z', 'lockout');
      const current = createSnapshot('health:current', '2026-07-12T12:00:00.000Z', 'secure', previous);

      repository.saveSnapshot(previous);
      repository.saveSnapshot(current, previous);

      const guardianChanges = repository.listHistory().filter((entry) => entry.dimensionId === 'guardian-stability');
      expect(guardianChanges.at(-1)).toMatchObject({
        snapshotId: current.snapshotId,
        oldState: 'critical',
        newState: 'healthy',
      });
    } finally {
      database.close();
    }
  });

  it('keeps institutional health migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('011_institutional_health_snapshots');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('011_institutional_health_snapshots');

    database.close();
  });
});

function createSnapshot(
  snapshotId: string,
  evaluatedAt: string,
  guardianState: 'secure' | 'lockout',
  previousSnapshot = undefined as ReturnType<typeof buildInstitutionalHealthSnapshot> | undefined,
) {
  return buildInstitutionalHealthSnapshot({
    snapshotId,
    evaluatedAt,
    missionState: 'observation',
    guardian: {
      state: guardianState,
      highestAlert: guardianState === 'secure' ? 'Guardian clear.' : 'Guardian lockout active.',
    },
    doctrine: { activeProtectiveRule: 'Wait for confirmation.', pendingCandidateCount: 0 },
    archive: { persistenceReady: true, archiveRecordCount: 1 },
    intelligence: { missingEvidenceCount: 0, contradictionCount: 0, confidenceLevel: 'complete', validatedEvidenceCount: 8 },
    previousSnapshot,
  });
}
