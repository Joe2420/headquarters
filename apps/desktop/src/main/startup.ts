import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ArchiveRepository,
  type HeadquartersDatabase,
  loadMigrationsFromDirectory,
  MissionRepository,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { MissionService } from '@headquarters/hqos';
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

export interface AppStartupRuntime {
  status: AppStartupStatus;
  createMission: (input: DesktopCreateMissionInput) => Promise<DesktopCreateMissionResult>;
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

    return {
      status: {
        state: 'ready',
        database: {
          connected: true,
          path: options.dbPath,
        },
        migrations: migrationResult,
      },
      createMission: async (input) => {
        const result = await missionService.createMission(input);
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
      createMission: async () => {
        throw new Error('Desktop startup is not ready for mission creation.');
      },
      close: () => undefined,
    };
  }
}

function createMissionService(database: HeadquartersDatabase): MissionService {
  const missionRepository = new MissionRepository(database);
  const archiveRepository = new ArchiveRepository(database);

  return new MissionService(
    missionRepository,
    {
      publish: (event) => archiveRepository.append(event),
    },
    {
      source: 'DesktopMissionCreation',
    },
  );
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
