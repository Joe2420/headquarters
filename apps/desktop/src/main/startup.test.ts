import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { ArchiveRepository, MissionRepository, openHeadquartersDatabase } from '@headquarters/database';
import { initializeAppStartup } from './startup';

const tempDirs: string[] = [];
const desktopDirectory = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const workspaceDirectory = dirname(dirname(desktopDirectory));
const migrationsDirectory = join(workspaceDirectory, 'packages/database/migrations');

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-startup-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

describe('App startup wiring', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('opens the local database and runs migrations idempotently', () => {
    const dbPath = createTempDatabasePath();
    let now = 1000;
    const firstStartup = initializeAppStartup({
      dbPath,
      migrationsDirectory,
      nowMs: () => {
        now += 125;
        return now;
      },
    });

    try {
      expect(firstStartup.status.state).toBe('ready');
      expect(firstStartup.status.database.connected).toBe(true);
      expect(firstStartup.status.migrations.applied).toEqual([
        '001_initial',
        '002_archive_events',
        '003_mission_creation_fields',
        '004_observation_sessions',
        '005_mission_debriefs',
        '006_doctrine_records',
        '007_doctrine_history',
        '008_journal_entries',
        '009_mission_context_records',
        '010_operational_consequences',
        '011_institutional_health_snapshots',
        '012_commander_relationship_snapshots',
      ]);
      expect(firstStartup.status.migrations.skipped).toEqual([]);
      expect(firstStartup.status.performance).toEqual({
        durationMs: 125,
        migrationCount: 12,
        budgetMs: 3000,
        status: 'within-budget',
      });
    } finally {
      firstStartup.close();
    }

    const secondStartup = initializeAppStartup({ dbPath, migrationsDirectory });

    try {
      expect(secondStartup.status.state).toBe('ready');
      expect(secondStartup.status.migrations.applied).toEqual([]);
      expect(secondStartup.status.migrations.skipped).toEqual([
        '001_initial',
        '002_archive_events',
        '003_mission_creation_fields',
        '004_observation_sessions',
        '005_mission_debriefs',
        '006_doctrine_records',
        '007_doctrine_history',
        '008_journal_entries',
        '009_mission_context_records',
        '010_operational_consequences',
        '011_institutional_health_snapshots',
        '012_commander_relationship_snapshots',
      ]);
    } finally {
      secondStartup.close();
    }
  });

  it('represents startup failure safely', () => {
    let now = 1000;
    const startup = initializeAppStartup({
      dbPath: createTempDatabasePath(),
      migrationsDirectory: join(process.cwd(), 'missing-migrations-directory'),
      startupBudgetMs: 100,
      nowMs: () => {
        now += 250;
        return now;
      },
    });

    expect(startup.status.state).toBe('failed');
    expect(startup.status.database.connected).toBe(false);
    expect(startup.status.performance.status).toBe('over-budget');
    expect(startup.status.error).toBeTruthy();
    startup.close();
  });

  it('creates a mission through startup-owned HQOS services and repositories', async () => {
    const dbPath = createTempDatabasePath();
    const startup = initializeAppStartup({ dbPath, migrationsDirectory });
    let missionId = '';

    try {
      const result = await startup.createMission({
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      });

      missionId = result.mission.id;
      expect(result.mission.codename).toBe('Foundation Patrol');
      expect(result.mission.objective).toBe('Hold the line');
      expect(result.mission.state).toBe('idle');
    } finally {
      startup.close();
    }

    const database = openHeadquartersDatabase(dbPath);

    try {
      const missions = new MissionRepository(database);
      const archive = new ArchiveRepository(database);
      const persistedMission = missions.findById(missionId);
      const events = archive.list();

      expect(persistedMission?.codename).toBe('Foundation Patrol');
      expect(events.map((event) => event.type)).toContain('mission.created');
    } finally {
      database.close();
    }
  });

  it('loads persisted missions and saves journal entries through startup-owned repositories', async () => {
    const startup = initializeAppStartup({ dbPath: createTempDatabasePath(), migrationsDirectory });

    try {
      const mission = await startup.createMission({
        codename: 'Archive Check',
        objective: 'Confirm persisted mission list',
      });
      const journal = await startup.createJournalEntry({
        content: 'Followed plan and protected capital.',
        entryDate: '2026-07-02',
        mood: 'Calm',
        marketConditions: 'Range day',
      });

      await expect(startup.listMissions()).resolves.toEqual({ missions: [mission.mission] });
      await expect(startup.listJournalEntries()).resolves.toEqual({ entries: [journal.entry] });
    } finally {
      startup.close();
    }
  });

  it('persists mission context records for reload hydration', async () => {
    const dbPath = createTempDatabasePath();
    const firstStartup = initializeAppStartup({ dbPath, migrationsDirectory });
    let missionId = '';
    const contextJson = JSON.stringify({
      missionId: 'pending',
      briefing: { missionObjective: 'Wait for clean confirmation.' },
      observation: {},
      commanderNotes: [],
      contradictionFlags: [],
      readiness: {
        briefingComplete: false,
        observationComplete: false,
        warRoomReady: false,
        debriefReady: false,
      },
      createdAt: '2026-07-11T10:00:00.000Z',
      updatedAt: '2026-07-11T10:00:00.000Z',
    });

    try {
      const mission = await firstStartup.createMission({
        codename: 'Memory Check',
        objective: 'Persist mission intelligence',
      });
      missionId = mission.mission.id;
      const savedContext = contextJson.replace('"pending"', `"${missionId}"`);

      await expect(firstStartup.saveMissionContext({
        missionId,
        contextJson: savedContext,
        createdAt: '2026-07-11T10:00:00.000Z',
        updatedAt: '2026-07-11T10:00:00.000Z',
      })).resolves.toMatchObject({
        record: {
          missionId,
          contextJson: savedContext,
        },
      });
    } finally {
      firstStartup.close();
    }

    const secondStartup = initializeAppStartup({ dbPath, migrationsDirectory });

    try {
      await expect(secondStartup.listMissionContexts()).resolves.toMatchObject({
        records: [
          {
            missionId,
          },
        ],
      });
    } finally {
      secondStartup.close();
    }
  });

  it('exposes doctrine records through a read-only startup query', async () => {
    const startup = initializeAppStartup({ dbPath: createTempDatabasePath(), migrationsDirectory });

    try {
      await expect(startup.listDoctrineRecords()).resolves.toEqual({ records: [] });
    } finally {
      startup.close();
    }
  });

  it('promotes a doctrine candidate and exposes the persisted record', async () => {
    const startup = initializeAppStartup({ dbPath: createTempDatabasePath(), migrationsDirectory });

    try {
      const result = await startup.promoteDoctrineCandidate({
        candidateId: 'candidate-001',
        title: 'Wait for confirmation',
        summary: 'Wait for confirmation before entry.',
        sourceId: 'journal-001',
        archiveId: 'archive-001',
        excerpt: 'Wait for confirmation before entry.',
      });

      expect(result.record.title).toBe('Wait for confirmation');
      expect(result.record.confidence).toBe('validated');
      expect(result.record.source).toEqual({
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
        excerpt: 'Wait for confirmation before entry.',
      });
      expect(result.historyEntry.doctrineId).toBe(result.record.id);
      expect(result.historyEntry.action).toBe('promoted');
      await expect(startup.listDoctrineRecords()).resolves.toEqual({ records: [result.record] });
      await expect(startup.listDoctrineHistory()).resolves.toEqual({ entries: [result.historyEntry] });
    } finally {
      startup.close();
    }
  });
});
