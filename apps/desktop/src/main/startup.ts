import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ArchiveRepository,
  DoctrineHistoryRepository,
  DoctrineRepository,
  type HeadquartersDatabase,
  JournalEntryRepository,
  type PersistedJournalEntry,
  loadMigrationsFromDirectory,
  MissionContextRepository,
  type MissionContextRecord,
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
import { summarizeStartupPerformance, type StartupPerformanceSummary } from './startupPerformance';

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
  performance: StartupPerformanceSummary;
  error?: string;
}

export interface DesktopCreateMissionInput {
  codename: string;
  objective: string;
}

export interface DesktopCreateMissionResult {
  mission: Mission;
}

export interface DesktopMissionListResult {
  missions: Mission[];
}

export interface DesktopMissionContextListResult {
  records: MissionContextRecord[];
}

export interface DesktopDoctrineListResult {
  records: DoctrineRecord[];
}

export interface DesktopDoctrineHistoryListResult {
  entries: DoctrineHistoryEntry[];
}

export interface DesktopJournalListResult {
  entries: PersistedJournalEntry[];
}

export interface DesktopCreateJournalEntryInput {
  content: string;
  entryDate: string;
  mood?: string;
  marketConditions?: string;
}

export interface DesktopCreateJournalEntryResult {
  entry: PersistedJournalEntry;
}

export interface DesktopSaveMissionContextInput {
  missionId: string;
  contextJson: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesktopSaveMissionContextResult {
  record: MissionContextRecord;
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
  listMissions: () => Promise<DesktopMissionListResult>;
  listMissionContexts: () => Promise<DesktopMissionContextListResult>;
  listJournalEntries: () => Promise<DesktopJournalListResult>;
  promoteDoctrineCandidate: (input: DesktopDoctrinePromotionInput) => Promise<DesktopDoctrinePromotionResult>;
  createMission: (input: DesktopCreateMissionInput) => Promise<DesktopCreateMissionResult>;
  saveMissionContext: (input: DesktopSaveMissionContextInput) => Promise<DesktopSaveMissionContextResult>;
  createJournalEntry: (input: DesktopCreateJournalEntryInput) => Promise<DesktopCreateJournalEntryResult>;
  startBriefing: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  completeBriefing: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  startObservation: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  completeObservation: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  requestAuthorization: (input: DesktopAuthorizationInput) => Promise<DesktopAuthorizationResult>;
  declareDeployment: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  requestReturnToBase: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  abortMission: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  rewindMission: (input: DesktopMissionCommandInput & { targetState: Mission['state'] }) => Promise<DesktopCreateMissionResult>;
  saveDebrief: (input: DesktopDebriefInput) => Promise<DesktopDebriefResult>;
  archiveAfterDebrief: (input: DesktopMissionCommandInput) => Promise<DesktopCreateMissionResult>;
  close: () => void;
}

export interface AppStartupOptions {
  dbPath: string;
  migrationsDirectory?: string;
  nowMs?: () => number;
  startupBudgetMs?: number;
}

export function initializeAppStartup(options: AppStartupOptions): AppStartupRuntime {
  let database: HeadquartersDatabase | undefined;
  const startedAtMs = readNowMs(options);

  try {
    database = openHeadquartersDatabase(options.dbPath);
    const migrations = options.migrationsDirectory
      ? loadMigrationsFromDirectory(options.migrationsDirectory)
      : loadDefaultMigrations();
    const migrationResult = runMigrations(database, migrations);
    const performance = summarizeStartupPerformance({
      startedAtMs,
      completedAtMs: readNowMs(options),
      migrationCount: migrationResult.applied.length + migrationResult.skipped.length,
      budgetMs: options.startupBudgetMs ?? 3000,
    });
    const missionService = createMissionService(database);
    const missionRepository = new MissionRepository(database);
    const missionContextRepository = new MissionContextRepository(database);
    const doctrineRepository = new DoctrineRepository(database);
    const doctrineHistoryRepository = new DoctrineHistoryRepository(database);
    const journalEntryRepository = new JournalEntryRepository(database);

    return {
      status: {
        state: 'ready',
        database: {
          connected: true,
          path: options.dbPath,
        },
        migrations: migrationResult,
        performance,
      },
      listDoctrineRecords: async () => ({
        records: doctrineRepository.list(),
      }),
      listDoctrineHistory: async () => ({
        entries: doctrineHistoryRepository.list(),
      }),
      listMissions: async () => ({
        missions: missionRepository.list(),
      }),
      listMissionContexts: async () => ({
        records: missionContextRepository.list(),
      }),
      listJournalEntries: async () => ({
        entries: journalEntryRepository.list(),
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
      saveMissionContext: async (input) => {
        const timestamp = new Date().toISOString();
        return {
          record: missionContextRepository.save({
            missionId: input.missionId,
            contextJson: input.contextJson,
            createdAt: input.createdAt ?? timestamp,
            updatedAt: input.updatedAt ?? timestamp,
          }),
        };
      },
      createJournalEntry: async (input) => {
        const entry = createPersistedJournalEntry(input);
        if (entry === undefined) throw new Error('Journal entry requires content and entryDate.');

        return {
          entry: journalEntryRepository.save(entry),
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
      abortMission: async (input) => {
        const mission = missionRepository.findById(input.missionId);
        if (mission === undefined) throw new Error(`Mission ${input.missionId} was not found.`);

        const abortedMission: Mission = {
          ...mission,
          state: 'archived',
          updatedAt: new Date().toISOString(),
        };
        missionRepository.save(abortedMission);

        return {
          mission: abortedMission,
        };
      },
      rewindMission: async (input) => {
        const mission = missionRepository.findById(input.missionId);
        if (mission === undefined) throw new Error(`Mission ${input.missionId} was not found.`);

        const rewoundMission: Mission = {
          ...mission,
          state: input.targetState,
          updatedAt: new Date().toISOString(),
        };
        missionRepository.save(rewoundMission);

        return {
          mission: rewoundMission,
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
    const performance = summarizeStartupPerformance({
      startedAtMs,
      completedAtMs: readNowMs(options),
      migrationCount: 0,
      budgetMs: options.startupBudgetMs ?? 3000,
    });

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
        performance,
        error: error instanceof Error ? error.message : 'Unknown startup failure',
      },
      listDoctrineRecords: async () => ({
        records: [],
      }),
      listDoctrineHistory: async () => ({
        entries: [],
      }),
      listMissions: async () => ({
        missions: [],
      }),
      listMissionContexts: async () => ({
        records: [],
      }),
      listJournalEntries: async () => ({
        entries: [],
      }),
      promoteDoctrineCandidate: async () => {
        throw new Error('Desktop startup is not ready for doctrine promotion.');
      },
      createMission: async () => {
        throw new Error('Desktop startup is not ready for mission creation.');
      },
      saveMissionContext: async () => {
        throw new Error('Desktop startup is not ready for mission context persistence.');
      },
      createJournalEntry: async () => {
        throw new Error('Desktop startup is not ready for journal persistence.');
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
      abortMission: async () => {
        throw new Error('Desktop startup is not ready for mission lifecycle.');
      },
      rewindMission: async () => {
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

function readNowMs(options: AppStartupOptions): number {
  return options.nowMs?.() ?? Date.now();
}

function createPersistedJournalEntry(input: DesktopCreateJournalEntryInput): PersistedJournalEntry | undefined {
  const rawContent = input.content.trim();
  const entryDate = input.entryDate.trim();

  if (!rawContent || !entryDate) return undefined;

  const timestamp = new Date().toISOString();
  const rawMood = normalizeOptionalText(input.mood);
  const rawMarketConditions = normalizeOptionalText(input.marketConditions);

  return {
    id: crypto.randomUUID(),
    entryDate,
    rawContent,
    ...(rawMood !== undefined ? { rawMood } : {}),
    ...(rawMarketConditions !== undefined ? { rawMarketConditions } : {}),
    source: 'manual',
    attachmentReferences: [],
    classificationStatus: 'unclassified',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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
    status: 'pending_review',
    proposedTitle: input.title,
    proposedRule: input.summary,
    rationale: `Operator submitted source evidence from journal entry ${input.sourceId}.`,
    evidenceSummary: input.excerpt,
    triggerCondition: 'Operator-reviewed context described by the source evidence.',
    expectedBehavior: input.summary,
    exceptionOrBoundary: 'Operator review is required before this rule is applied beyond its source context.',
    proposedScope: 'Operator-approved doctrine candidate',
    similarDoctrineIds: [],
    conflictSummary: 'No accepted Doctrine comparison has been performed yet.',
    supportingEvidenceCount: 1,
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
