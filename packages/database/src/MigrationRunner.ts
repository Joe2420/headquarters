import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type DatabaseDriver from 'better-sqlite3';
import { HeadquartersDatabase } from './Database';

export interface Migration {
  version: string;
  sql: string;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

export const SCHEMA_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`;

export class MigrationRunner {
  constructor(private readonly db: DatabaseDriver.Database) {}

  run(migrations: readonly Migration[]): MigrationResult {
    this.db.exec(SCHEMA_MIGRATIONS_TABLE_SQL);

    const applied = new Set(this.getAppliedVersions());
    const result: MigrationResult = { applied: [], skipped: [] };

    for (const migration of migrations) {
      if (applied.has(migration.version)) {
        result.skipped.push(migration.version);
        continue;
      }

      const applyMigration = this.db.transaction(() => {
        this.db.exec(migration.sql);
        this.db.prepare(`
          INSERT OR IGNORE INTO schema_migrations (version, applied_at)
          VALUES (?, datetime('now'))
        `).run(migration.version);
      });

      applyMigration();
      applied.add(migration.version);
      result.applied.push(migration.version);
    }

    return result;
  }

  getAppliedVersions(): string[] {
    this.db.exec(SCHEMA_MIGRATIONS_TABLE_SQL);

    const rows = this.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as Array<{
      version: string;
    }>;

    return rows.map((row) => row.version);
  }
}

export function runMigrations(database: HeadquartersDatabase, migrations: readonly Migration[]): MigrationResult {
  return new MigrationRunner(database.connection).run(migrations);
}

export function loadMigrationsFromDirectory(directory: string): Migration[] {
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => ({
      version: fileName.replace(/\.sql$/u, ''),
      sql: readFileSync(join(directory, fileName), 'utf8'),
    }));
}
