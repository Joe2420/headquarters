import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { DoctrineHistoryAction, DoctrineHistoryEntry } from '@headquarters/doctrine';
import { HeadquartersDatabase } from './Database';

interface DoctrineHistoryRow {
  id: string;
  doctrine_id: string;
  action: DoctrineHistoryAction;
  summary: string;
  occurred_at: string;
}

export class DoctrineHistoryRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  append(entry: DoctrineHistoryEntry): DoctrineHistoryEntry {
    this.db.prepare(`
      INSERT INTO doctrine_history (
        id,
        doctrine_id,
        action,
        summary,
        occurred_at
      )
      VALUES (
        @id,
        @doctrineId,
        @action,
        @summary,
        @occurredAt
      )
    `).run(entry);

    return copyEntry(entry);
  }

  list(): DoctrineHistoryEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM doctrine_history ORDER BY occurred_at ASC, id ASC')
      .all() as DoctrineHistoryRow[];

    return rows.map(mapRowToDoctrineHistoryEntry);
  }

  listByDoctrineId(doctrineId: string): DoctrineHistoryEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM doctrine_history WHERE doctrine_id = ? ORDER BY occurred_at ASC, id ASC')
      .all(doctrineId) as DoctrineHistoryRow[];

    return rows.map(mapRowToDoctrineHistoryEntry);
  }
}

function mapRowToDoctrineHistoryEntry(row: DoctrineHistoryRow): DoctrineHistoryEntry {
  return {
    id: row.id,
    doctrineId: row.doctrine_id,
    action: row.action,
    summary: row.summary,
    occurredAt: row.occurred_at,
  };
}

function copyEntry(entry: DoctrineHistoryEntry): DoctrineHistoryEntry {
  return { ...entry };
}
