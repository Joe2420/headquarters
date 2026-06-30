import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ArchiveRepository,
  DoctrineHistoryRepository,
  DoctrineRepository,
  type HeadquartersDatabase,
  loadMigrationsFromDirectory,
  MissionDebriefRepository,
  MissionRepository,
  ObservationSessionRepository,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { MissionService } from '@headquarters/hqos';
import {
  createDoctrineHistoryEntry,
  promoteDoctrineCandidate,
  type DoctrineCandidate,
  type DoctrineHistoryEntry,
  type DoctrineRecord,
} from '@headquarters/doctrine';
import type { Mission } from '@headquarters/shared';

export type StartupState = 'ready' | 'failed';

export interface AppStartupStatus {
  state: StartupState;
  database: {
    connected: boolean;
    path?: string;
  };
  migrations: {
    applied: string[];
    skipped: string[];
  };
  error?: string;
}

export interface DesktopCreateMissionInput {
  codename: string;
  objective: string;
}

export interface DesktopCreateMissionResult {
  mission: Mission;
}

export interface DesktopDoctrineListResult {
  records: DoctrineRecord[];
}

export interface DesktopDoctrineHistoryListResult {
  entries: DoctrineHistoryEntry[];
}

export interface DesktopDoctrinePromotionInput {
  candidateId: string;
  title: string;
  summary: string;
  sourceId: string;
  archiveId: string;
  excerpt: string;
}

export interface DesktopDoctrinePromotionResult {
  record: DoctrineRecord;
  historyEntry: DoctrineHistoryEntry;
}

export interface DesktopMissionCommandInput {
  missionId: string;
  reason?: string;
}

export interface DesktopAuthorizationInput {
  missionId: string;
  operatorJustification: string;
  invalidation: string;
}

export interface DesktopAuthorizationResult {
  mission: Mission;
  decision: 'approved' | 'denied';
  reason: string;
}

export interface DesktopDebriefInput {
  missionId: string;
  behaviorSummary: string;
  disciplineNotes: string;
  lesson: string;
}

export interface DesktopDebriefResult {
  mission: Mission;
  debrief: {
    id: string;
    missionId: string;
    behaviorSummary: string;
    disciplineNotes: string;
    lesson: string;
    createdAt: string;
  };
}

export interface AppStartupRuntime {
  status: AppStartupStatus;
  listDoctrineRecords: () => Promise<DesktopDoctrineListResult>;
  listDoctrineHistory: () => Promise<DesktopDoctrineHistoryListResult>;
  promoteDoctrineCandidate: (input: DesktopDoctrinePromotionInput) => Promise<DesktopDoctrinePromotionResult>;
  createMission: (input: DesktopCreateMissionInput) => Promise<DesktopCreateMissionResult>;
  startBriefing: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  completeBriefing: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  startObservation: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  completeObservation: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  requestAuthorization: (input: DesktopAuthorizationInput) => Promise<DesktopAuthorizationResult>;
  declareDeployment: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  requestReturnToBase: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  saveDebrief: (input: DesktopDebriefInput) => Promise<DesktopDebriefResult>;
  archiveAfterDebrief: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  close: () => void;
}

export interface AppStartupOptions {
  dbPath: string;
  migrationsDirectory?: string;
}

export function initializeAppStartup(options: AppStartupOptions): AppStartupRuntime {
  let database: HeadquartersDatabase | undefined;

  try {
    database = openHeadquartersDatabase(options.dbPath);
    const migrations = options.migrationsDirectory
      ? loadMigrationsFromDirectory(options.migrationsDirectory)
      : loadDefaultMigrations();
    const migrationResult = runMigrations(database, migrations);
    const missionService = createMissionService(database);
    const doctrineRepository = new DoctrineRepository(database);
    const doctrineHistoryRepository = new DoctrineHistoryRepository(database);

    return {
      status: {
        state: 'ready',
        database: {
          connected: true,
          path: options.dbPath,
        },
        migrations: migrationResult,
      },
      listDoctrineRecords: async () => ({
        records: doctrineRepository.list(),
      }),
      listDoctrineHistory: async () => ({
        entries: doctrineHistoryRepository.list(),
      }),
      promoteDoctrineCandidate: async (input) => {
        const candidate = mapPromotionInputToCandidate(input);
        const record = promoteDoctrineCandidate(candidate);
        const savedRecord = doctrineRepository.save(record);
        const historyEntry = doctrineHistoryRepository.append(createDoctrineHistoryEntry(savedRecord, 'promoted'));
        return {
          record: savedRecord,
          historyEntry,
        };
      },
      createMission: async (input) => {
        const result = await missionService.createMission(input);
        return {
          mission: result.mission,
        };
      },
      startBriefing: async (input) => {
        const result = await missionService.startBriefing(input);
        return {
          mission: result.mission,
        };
      },
      completeBriefing: async (input) => {
        const result = await missionService.completeBriefing(input);
        return {
          mission: result.mission,
        };
      },
      startObservation: async (input) => {
        const result = await missionService.startObservation(input);
        return {
          mission: result.mission,
        };
      },
      completeObservation: async (input) => {
        const result = await missionService.completeObservation(input);
        return {
          mission: result.mission,
        };
      },
      requestAuthorization: async (input) => {
        const result = await missionService.requestAuthorization(input);
        return {
          mission: result.mission,
          decision: result.decision.decision,
          reason: result.decision.reason ?? 'Authorization evaluated.',
        };
      },
      declareDeployment: async (input) => {
        const result = await missionService.declareDeployment(input);
        return {
          mission: result.mission,
        };
      },
      requestReturnToBase: async (input) => {
        const result = await missionService.requestReturnToBase(input);
        return {
          mission: result.mission,
        };
      },
      saveDebrief: async (input) => {
        const result = await missionService.saveDebrief(input);
        return {
          mission: result.mission,
          debrief: result.debrief,
        };
      },
      archiveAfterDebrief: async (input) => {
        const result = await missionService.archiveAfterDebrief(input);
        return {
          mission: result.mission,
        };
      },
      close: () => database?.close(),
    };
  } catch (error) {
    database?.close();

    return {
      status: {
        state: 'failed',
        database: {
          connected: false,
          path: options.dbPath,
        },
        migrations: {
          applied: [],
          skipped: [],
        },
        error: error instanceof Error ? error.message : 'Unknown startup failure',
      },
      listDoctrineRecords: async () => ({
        records: [],
      }),
      listDoctrineHistory: async () => ({
        entries: [],
      }),
      promoteDoctrineCandidate: async () => {
        throw new Error('Desktop startup is not ready for doctrine promotion.');
      },
      createMission: async () => {
        throw new Error('Desktop startup is not ready for mission creation.');
      },
      startBriefing: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      completeBriefing: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      startObservation: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      completeObservation: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      requestAuthorization: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      declareDeployment: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      requestReturnToBase: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      saveDebrief: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      archiveAfterDebrief: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      close: () => undefined,
    };
  }
}

function createMissionService(database: HeadquartersDatabase): MissionService {
  const missionRepository = new MissionRepository(database);
  const archiveRepository = new ArchiveRepository(database);
  const observationSessionRepository = new ObservationSessionRepository(database);
  const debriefRepository = new MissionDebriefRepository(database);

  return new MissionService(
    missionRepository,
    {
      publish: (event) => archiveRepository.append(event),
    },
    {
      source: 'DesktopMissionCreation',
    },
    undefined,
    observationSessionRepository,
    undefined,
    debriefRepository,
  );
}

function mapPromotionInputToCandidate(input: DesktopDoctrinePromotionInput): DoctrineCandidate {
  return {
    id: input.candidateId,
    title: input.title,
    summary: input.summary,
    status: 'candidate',
    source: {
      sourceType: 'journal_entry',
      sourceId: input.sourceId,
      archiveId: input.archiveId,
      excerpt: input.excerpt,
    },
    createdAt: new Date().toISOString(),
  };
}

export function getDefaultMigrationsDirectory(): string {
  return findDefaultMigrationsDirectory() ?? join(process.cwd(), 'packages', 'database', 'migrations');
}

function loadDefaultMigrations() {
  const migrationsDirectory = findDefaultMigrationsDirectory();

  if (!migrationsDirectory) {
    return [];
  }

  return loadMigrationsFromDirectory(migrationsDirectory);
}

function findDefaultMigrationsDirectory(): string | undefined {
  let directory = process.cwd();

  while (true) {
    const candidate = join(directory, 'packages', 'database', 'migrations');

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(directory);

    if (parent === directory) {
      return undefined;
    }

    directory = parent;
  }
}
