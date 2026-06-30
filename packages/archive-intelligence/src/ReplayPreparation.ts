import type { ArchiveIntelligenceRecord } from './ArchiveSearch';

export interface ArchiveReplayItem {
  readonly sequence: number;
  readonly recordId: string;
  readonly occurredAt: string;
  readonly recordType: ArchiveIntelligenceRecord['type'];
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface ArchiveReplayPreparation {
  readonly totalItems: number;
  readonly preparedAt: string;
  readonly items: readonly ArchiveReplayItem[];
}

export function prepareArchiveReplay(
  records: readonly ArchiveIntelligenceRecord[],
  preparedAt: string,
): ArchiveReplayPreparation {
  const orderedRecords = [...records].sort((left, right) => {
    const timeComparison = left.occurredAt.localeCompare(right.occurredAt);
    if (timeComparison !== 0) return timeComparison;
    return left.id.localeCompare(right.id);
  });

  const items = orderedRecords.map((record, index): ArchiveReplayItem => {
    return {
      sequence: index + 1,
      recordId: record.id,
      occurredAt: record.occurredAt,
      recordType: record.type,
      title: record.title,
      summary: record.summary,
      tags: [...record.tags],
    };
  });

  return {
    totalItems: items.length,
    preparedAt,
    items,
  };
}
