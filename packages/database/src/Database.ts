import DatabaseDriver from 'better-sqlite3';

export class HeadquartersDatabase {
  private db: DatabaseDriver.Database;

  constructor(path: string) {
    this.db = new DatabaseDriver(path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  close(): void {
    this.db.close();
  }

  execute(sql: string): void {
    this.db.exec(sql);
  }
}
