import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const dbPath = process.env.HEADQUARTERS_DB ?? path.resolve(process.cwd(), 'headquarters.local.sqlite');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(scriptDir, '../migrations/001_initial.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(sql);
db.close();
console.log(`Database migrated: ${dbPath}`);