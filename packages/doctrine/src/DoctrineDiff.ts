import type { DoctrineRecord } from './DoctrineRecord';

export type DoctrineDiffField = 'title' | 'summary' | 'confidence' | 'source';

export interface DoctrineDiffChange {
  readonly field: DoctrineDiffField;
  readonly before: string;
  readonly after: string;
}

export interface DoctrineDiff {
  readonly beforeId: string;
  readonly afterId: string;
  readonly changes: DoctrineDiffChange[];
  readonly changed: boolean;
}

export function diffDoctrineRecords(before: DoctrineRecord, after: DoctrineRecord): DoctrineDiff {
  const changes: DoctrineDiffChange[] = [];

  addChange(changes, 'title', before.title, after.title);
  addChange(changes, 'summary', before.summary, after.summary);
  addChange(changes, 'confidence', before.confidence, after.confidence);
  addChange(changes, 'source', formatSource(before), formatSource(after));

  return {
    beforeId: before.id,
    afterId: after.id,
    changes,
    changed: changes.length > 0,
  };
}

function addChange(changes: DoctrineDiffChange[], field: DoctrineDiffField, before: string, after: string): void {
  if (before === after) return;
  changes.push({ field, before, after });
}

function formatSource(record: DoctrineRecord): string {
  const excerpt = record.source.excerpt ? `: ${record.source.excerpt}` : '';
  return `${record.source.sourceType}:${record.source.sourceId}${excerpt}`;
}
