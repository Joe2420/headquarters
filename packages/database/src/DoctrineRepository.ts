import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { DoctrineConfidence, DoctrineRecord, DoctrineSourceReference } from '@headquarters/doctrine';
import { HeadquartersDatabase } from './Database';

interface DoctrineRecordRow {
  id: string;
  title: string;
  summary: string;
  confidence: DoctrineConfidence;
  source_type: DoctrineSourceReference['sourceType'];
  source_id: string;
  source_excerpt: string | null;
  created_at: string;
  updated_at: string;
}

export class DoctrineRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  save(record: DoctrineRecord): DoctrineRecord {
    this.db.prepare(`
      INSERT INTO doctrine_records (
        id,
        title,
        summary,
        confidence,
        source_type,
        source_id,
        source_excerpt,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @title,
        @summary,
        @confidence,
        @sourceType,
        @sourceId,
        @sourceExcerpt,
        @createdAt,
        @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        confidence = excluded.confidence,
        source_type = excluded.source_type,
        source_id = excluded.source_id,
        source_excerpt = excluded.source_excerpt,
        updated_at = excluded.updated_at
    `).run({
      id: record.id,
      title: record.title,
      summary: record.summary,
      confidence: record.confidence,
      sourceType: record.source.sourceType,
      sourceId: record.source.sourceId,
      sourceExcerpt: record.source.excerpt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return copyRecord(record);
  }

  getById(id: string): DoctrineRecord | undefined {
    const row = this.db.prepare('SELECT * FROM doctrine_records WHERE id = ?').get(id) as DoctrineRecordRow | undefined;
    return row === undefined ? undefined : mapRowToDoctrineRecord(row);
  }

  list(): DoctrineRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM doctrine_records ORDER BY created_at ASC, id ASC')
      .all() as DoctrineRecordRow[];

    return rows.map(mapRowToDoctrineRecord);
  }
}

function mapRowToDoctrineRecord(row: DoctrineRecordRow): DoctrineRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    confidence: row.confidence,
    source: {
      sourceType: row.source_type,
      sourceId: row.source_id,
      ...(row.source_excerpt !== null ? { excerpt: row.source_excerpt } : {}),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function copyRecord(record: DoctrineRecord): DoctrineRecord {
  return {
    ...record,
    source: { ...record.source },
  };
}
