import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  type HeadquartersDatabase,
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';

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

export interface AppStartupRuntime {
  status: AppStartupStatus;
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

    return {
      status: {
        state: 'ready',
        database: {
          connected: true,
          path: options.dbPath,
        },
        migrations: migrationResult,
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
      close: () => undefined,
    };
  }
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
