import type { ISODateTime, UUID } from '@headquarters/shared';
import type { DoctrineRecord } from './DoctrineRecord';

export type DoctrineHistoryAction = 'promoted' | 'updated' | 'retired';

export interface DoctrineHistoryEntry {
  readonly id: UUID;
  readonly doctrineId: UUID;
  readonly action: DoctrineHistoryAction;
  readonly summary: string;
  readonly occurredAt: ISODateTime;
}

export interface CreateDoctrineHistoryEntryOptions {
  readonly id?: UUID;
  readonly occurredAt?: ISODateTime;
}

export function createDoctrineHistoryEntry(
  record: DoctrineRecord,
  action: DoctrineHistoryAction,
  options: CreateDoctrineHistoryEntryOptions = {},
): DoctrineHistoryEntry {
  const occurredAt = options.occurredAt ?? record.updatedAt;

  return {
    id: options.id ?? crypto.randomUUID(),
    doctrineId: record.id,
    action,
    summary: summarizeDoctrineHistory(record, action),
    occurredAt,
  };
}

export function sortDoctrineHistory(entries: readonly DoctrineHistoryEntry[]): DoctrineHistoryEntry[] {
  return entries
    .map(copyDoctrineHistoryEntry)
    .sort((first, second) => first.occurredAt.localeCompare(second.occurredAt) || first.id.localeCompare(second.id));
}

export function copyDoctrineHistoryEntry(entry: DoctrineHistoryEntry): DoctrineHistoryEntry {
  return { ...entry };
}

function summarizeDoctrineHistory(record: DoctrineRecord, action: DoctrineHistoryAction): string {
  if (action === 'promoted') {
    return `Promoted candidate to doctrine: ${record.title}`;
  }

  if (action === 'retired') {
    return `Retired doctrine: ${record.title}`;
  }

  return `Updated doctrine: ${record.title}`;
}
