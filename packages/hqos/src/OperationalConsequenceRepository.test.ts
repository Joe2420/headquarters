import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { createOperationalConsequence } from './OperationalConsequence';
import { OperationalConsequenceRepository } from './OperationalConsequenceRepository';

const tempDirs: string[] = [];
const migrationsDirectory = existsSync(join(process.cwd(), 'packages/database/migrations'))
  ? join(process.cwd(), 'packages/database/migrations')
  : join(process.cwd(), '../database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-consequence-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

describe('OperationalConsequenceRepository', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('persists consequences and loads them after reopening', () => {
    const path = createTempDatabasePath();
    const firstDatabase = openHeadquartersDatabase(path);
    runMigrations(firstDatabase, loadMigrationsFromDirectory(migrationsDirectory));
    const consequence = createTestConsequence();
    new OperationalConsequenceRepository(firstDatabase).saveConsequence(consequence);
    firstDatabase.close();

    const secondDatabase = openHeadquartersDatabase(path);
    try {
      runMigrations(secondDatabase, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new OperationalConsequenceRepository(secondDatabase);

      expect(repository.getConsequenceById(consequence.consequenceId)).toEqual(consequence);
      expect(repository.listConsequencesForMission(consequence.missionId)).toEqual([consequence]);
    } finally {
      secondDatabase.close();
    }
  });

  it('persists recovery progress and resolution history', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    try {
      runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new OperationalConsequenceRepository(database);
      const consequence = createTestConsequence();
      repository.saveConsequence(consequence);

      const recovering = repository.recordRecoveryProgress(consequence.consequenceId, 'recovery:mission-1:debrief', {
        completedAt: '2026-07-12T12:30:00.000Z',
        evidenceReferences: [{ id: 'debrief:mission-1', source: 'debrief' }],
      });
      const resolved = repository.resolveConsequence(consequence.consequenceId, {
        resolvedAt: '2026-07-12T12:40:00.000Z',
        resolutionEvidence: [{ id: 'debrief:mission-1', source: 'debrief' }],
      });

      expect(recovering.recoveryRequirements[0]?.completionState).toBe('satisfied');
      expect(resolved.status).toBe('resolved');
      expect(repository.listActiveConsequences()).toEqual([]);
      expect(repository.listHistoricalConsequences()).toEqual([resolved]);
    } finally {
      database.close();
    }
  });

  it('prevents duplicate saves from duplicating records', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    try {
      runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));
      const repository = new OperationalConsequenceRepository(database);
      const consequence = createTestConsequence();

      repository.saveConsequence(consequence);
      repository.saveConsequence(consequence);

      expect(repository.listConsequencesForMission(consequence.missionId)).toHaveLength(1);
      expect(repository.listBlockingConsequences()).toEqual([consequence]);
    } finally {
      database.close();
    }
  });

  it('keeps operational consequence migration idempotent', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const migrations = loadMigrationsFromDirectory(migrationsDirectory);
    const firstRun = runMigrations(database, migrations);
    const secondRun = runMigrations(database, migrations);

    expect(firstRun.applied).toContain('010_operational_consequences');
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toContain('010_operational_consequences');

    database.close();
  });
});

function createTestConsequence() {
  return createOperationalConsequence({
    consequenceId: 'consequence:mission-1:incomplete-debrief',
    missionId: 'mission-1',
    category: 'lifecycle',
    type: 'incomplete_debrief',
    severity: 'restriction',
    title: 'Debrief incomplete',
    explanation: 'Debrief evidence is required.',
    cause: 'Debrief evidence missing.',
    effect: 'Archive completion blocked.',
    evidenceReferences: [{ id: 'evaluation:mission-1', source: 'mission-evaluation' }],
    createdAt: '2026-07-12T12:00:00.000Z',
    activatedAt: '2026-07-12T12:00:00.000Z',
    recoveryRequirements: [{
      requirementId: 'recovery:mission-1:debrief',
      description: 'Complete the debrief.',
      type: 'complete_debrief',
      evidenceRequired: true,
    }],
  });
}
