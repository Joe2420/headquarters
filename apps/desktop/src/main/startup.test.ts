import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeAppStartup } from './startup';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');

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
    const firstStartup = initializeAppStartup({ dbPath, migrationsDirectory });

    expect(firstStartup.status.state).toBe('ready');
    expect(firstStartup.status.database.connected).toBe(true);
    expect(firstStartup.status.migrations.applied).toEqual(['001_initial', '002_archive_events']);
    expect(firstStartup.status.migrations.skipped).toEqual([]);
    firstStartup.close();

    const secondStartup = initializeAppStartup({ dbPath, migrationsDirectory });

    expect(secondStartup.status.state).toBe('ready');
    expect(secondStartup.status.migrations.applied).toEqual([]);
    expect(secondStartup.status.migrations.skipped).toEqual(['001_initial', '002_archive_events']);
    secondStartup.close();
  });

  it('represents startup failure safely', () => {
    const startup = initializeAppStartup({
      dbPath: createTempDatabasePath(),
      migrationsDirectory: join(process.cwd(), 'missing-migrations-directory'),
    });

    expect(startup.status.state).toBe('failed');
    expect(startup.status.database.connected).toBe(false);
    expect(startup.status.error).toBeTruthy();
    startup.close();
  });
});
