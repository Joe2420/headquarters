import type { ISODateTime, UUID } from '@headquarters/shared';

export type DoctrineConfidence = 'candidate' | 'validated' | 'retired';

export interface DoctrineSourceReference {
  readonly sourceType: 'journal_entry' | 'trade_review' | 'manual';
  readonly sourceId: UUID;
  readonly excerpt?: string;
}

export interface DoctrineRecordDraft {
  readonly title: string;
  readonly summary: string;
  readonly confidence?: DoctrineConfidence;
  readonly source: DoctrineSourceReference;
}

export interface DoctrineRecord {
  readonly id: UUID;
  readonly title: string;
  readonly summary: string;
  readonly confidence: DoctrineConfidence;
  readonly source: DoctrineSourceReference;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface DoctrineRepository {
  save(record: DoctrineRecord): Promise<DoctrineRecord>;
  getById(id: UUID): Promise<DoctrineRecord | undefined>;
  list(): Promise<DoctrineRecord[]>;
}

export interface CreateDoctrineRecordOptions {
  readonly id?: UUID;
  readonly now?: ISODateTime;
}

export class InMemoryDoctrineRepository implements DoctrineRepository {
  readonly #records = new Map<UUID, DoctrineRecord>();

  async save(record: DoctrineRecord): Promise<DoctrineRecord> {
    this.#records.set(record.id, copyDoctrineRecord(record));
    return copyDoctrineRecord(record);
  }

  async getById(id: UUID): Promise<DoctrineRecord | undefined> {
    const record = this.#records.get(id);
    return record ? copyDoctrineRecord(record) : undefined;
  }

  async list(): Promise<DoctrineRecord[]> {
    return Array.from(this.#records.values()).map(copyDoctrineRecord);
  }
}

export function createDoctrineRecord(
  draft: DoctrineRecordDraft,
  options: CreateDoctrineRecordOptions = {},
): DoctrineRecord | undefined {
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const excerpt = draft.source.excerpt?.trim();
  const sourceId = draft.source.sourceId.trim();

  if (!title || !summary || !sourceId) return undefined;

  const timestamp = options.now ?? new Date().toISOString();

  return {
    id: options.id ?? crypto.randomUUID(),
    title,
    summary,
    confidence: draft.confidence ?? 'validated',
    source: {
      sourceType: draft.source.sourceType,
      sourceId,
      ...(excerpt ? { excerpt } : {}),
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function copyDoctrineRecord(record: DoctrineRecord): DoctrineRecord {
  return {
    ...record,
    source: { ...record.source },
  };
}
