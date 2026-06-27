import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MigrationRunner, openHeadquartersDatabase, runMigrations, type Migration } from './index';

const tempDirs: string[] = [];

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-db-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

const initialMigration: Migration = {
  version: '001_initial',
  sql: `
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,
};

describe('HeadquartersDatabase', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('creates a local SQLite database file and closes safely', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());

    expect(database.isOpen).toBe(true);
    expect(database.connection.prepare('SELECT 1 AS ok').get()).toEqual({ ok: 1 });

    database.close();
    database.close();

    expect(database.isOpen).toBe(false);
  });

  it('applies migrations once and records them in schema_migrations', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());

    const firstRun = runMigrations(database, [initialMigration]);
    const secondRun = runMigrations(database, [initialMigration]);
    const migrationRows = database.connection
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all();

    expect(firstRun).toEqual({ applied: ['001_initial'], skipped: [] });
    expect(secondRun).toEqual({ applied: [], skipped: ['001_initial'] });
    expect(migrationRows).toEqual([{ version: '001_initial' }]);
    expect(database.connection.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'operators'").get()).toEqual({
      name: 'operators',
    });

    database.close();
  });

  it('exposes applied migration versions through the runner', () => {
    const database = openHeadquartersDatabase(createTempDatabasePath());
    const runner = new MigrationRunner(database.connection);

    runner.run([initialMigration]);

    expect(runner.getAppliedVersions()).toEqual(['001_initial']);

    database.close();
  });
});
