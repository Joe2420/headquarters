import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { ISODateTime, UUID } from '@headquarters/shared';
import { HeadquartersDatabase } from './Database';

export type PersistedJournalEntrySource = 'manual' | 'production_export';
export type PersistedJournalEntryClassificationStatus = 'unclassified' | 'classified';

export interface PersistedJournalEntry {
  readonly id: UUID;
  readonly entryDate: string;
  readonly rawContent: string;
  readonly rawMood?: string;
  readonly rawMarketConditions?: string;
  readonly source: PersistedJournalEntrySource;
  readonly attachmentReferences: readonly string[];
  readonly classificationStatus: PersistedJournalEntryClassificationStatus;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

interface JournalEntryRow {
  id: string;
  entry_date: string;
  raw_content: string;
  raw_mood: string | null;
  raw_market_conditions: string | null;
  source: PersistedJournalEntrySource;
  attachment_references_json: string;
  classification_status: PersistedJournalEntryClassificationStatus;
  created_at: string;
  updated_at: string;
}

export class JournalEntryRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  save(entry: PersistedJournalEntry): PersistedJournalEntry {
    this.db.prepare(`
      INSERT INTO journal_entries (
        id,
        entry_date,
        raw_content,
        raw_mood,
        raw_market_conditions,
        source,
        attachment_references_json,
        classification_status,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @entryDate,
        @rawContent,
        @rawMood,
        @rawMarketConditions,
        @source,
        @attachmentReferencesJson,
        @classificationStatus,
        @createdAt,
        @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        entry_date = excluded.entry_date,
        raw_content = excluded.raw_content,
        raw_mood = excluded.raw_mood,
        raw_market_conditions = excluded.raw_market_conditions,
        source = excluded.source,
        attachment_references_json = excluded.attachment_references_json,
        classification_status = excluded.classification_status,
        updated_at = excluded.updated_at
    `).run({
      id: entry.id,
      entryDate: entry.entryDate,
      rawContent: entry.rawContent,
      rawMood: entry.rawMood ?? null,
      rawMarketConditions: entry.rawMarketConditions ?? null,
      source: entry.source,
      attachmentReferencesJson: JSON.stringify(entry.attachmentReferences),
      classificationStatus: entry.classificationStatus,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });

    return copyJournalEntry(entry);
  }

  findById(id: string): PersistedJournalEntry | undefined {
    const row = this.db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as JournalEntryRow | undefined;
    return row === undefined ? undefined : mapRowToJournalEntry(row);
  }

  list(): PersistedJournalEntry[] {
    const rows = this.db.prepare('SELECT * FROM journal_entries ORDER BY entry_date ASC, created_at ASC, id ASC').all() as JournalEntryRow[];
    return rows.map(mapRowToJournalEntry);
  }
}

function mapRowToJournalEntry(row: JournalEntryRow): PersistedJournalEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    rawContent: row.raw_content,
    ...(row.raw_mood !== null ? { rawMood: row.raw_mood } : {}),
    ...(row.raw_market_conditions !== null ? { rawMarketConditions: row.raw_market_conditions } : {}),
    source: row.source,
    attachmentReferences: parseAttachmentReferences(row.attachment_references_json),
    classificationStatus: row.classification_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseAttachmentReferences(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function copyJournalEntry(entry: PersistedJournalEntry): PersistedJournalEntry {
  return {
    ...entry,
    attachmentReferences: [...entry.attachmentReferences],
  };
}
