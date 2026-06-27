import { join } from 'node:path';
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
    const migrations = loadMigrationsFromDirectory(options.migrationsDirectory ?? getDefaultMigrationsDirectory());
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
  return join(process.cwd(), 'packages', 'database', 'migrations');
}
