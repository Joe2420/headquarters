import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const dbPath = process.env.HEADQUARTERS_DB ?? path.resolve(process.cwd(), 'headquarters.local.sqlite');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(scriptDir, '../migrations');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`);

const migrationFiles = fs.readdirSync(migrationsDirectory)
  .filter((fileName) => fileName.endsWith('.sql'))
  .sort();

for (const fileName of migrationFiles) {
  const version = path.basename(fileName, '.sql');
  const existing = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version);

  if (!existing) {
    const sql = fs.readFileSync(path.join(migrationsDirectory, fileName), 'utf8');
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare(`
        INSERT OR IGNORE INTO schema_migrations (version, applied_at)
        VALUES (?, datetime('now'))
      `).run(version);
    });

    applyMigration();
  }
}

db.close();
console.log(`Database migrated: ${dbPath}`);
