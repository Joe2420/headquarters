export type ArchiveRecordType = 'mission' | 'journal' | 'doctrine' | 'guardian' | 'academy';

export interface ArchiveIntelligenceRecord {
  readonly id: string;
  readonly type: ArchiveRecordType;
  readonly title: string;
  readonly summary: string;
  readonly occurredAt: string;
  readonly tags: readonly string[];
}

export interface ArchiveSearchQuery {
  readonly text?: string;
  readonly type?: ArchiveRecordType;
  readonly tag?: string;
}

export function searchArchiveRecords(
  records: readonly ArchiveIntelligenceRecord[],
  query: ArchiveSearchQuery,
): readonly ArchiveIntelligenceRecord[] {
  const text = query.text?.trim().toLowerCase();
  const tag = query.tag?.trim().toLowerCase();

  return records.filter((record) => {
    if (query.type !== undefined && record.type !== query.type) return false;
    if (tag !== undefined && !record.tags.some((recordTag) => recordTag.toLowerCase() === tag)) return false;
    if (text === undefined || text.length === 0) return true;

    return [record.id, record.title, record.summary, record.type, ...record.tags].some((field) =>
      field.toLowerCase().includes(text),
    );
  });
}
