import DatabaseDriver from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class HeadquartersDatabase {
  private readonly db: DatabaseDriver.Database;

  constructor(readonly path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseDriver(path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  get connection(): DatabaseDriver.Database {
    return this.db;
  }

  get isOpen(): boolean {
    return this.db.open;
  }

  close(): void {
    if (this.db.open) {
      this.db.close();
    }
  }

  execute(sql: string): void {
    this.db.exec(sql);
  }
}

export function openHeadquartersDatabase(path: string): HeadquartersDatabase {
  return new HeadquartersDatabase(path);
}
