import {
  copyJournalEntry,
  type JournalEntry,
  type JournalEntryClassificationStatus,
} from './JournalEntry';

export interface JournalArchiveMetadata {
  readonly classificationStatus: JournalEntryClassificationStatus;
  readonly tags: readonly string[];
}

export interface ArchivedJournalEntry {
  readonly id: string;
  readonly journalEntryId: string;
  readonly rawEntry: JournalEntry;
  readonly metadata: JournalArchiveMetadata;
  readonly archivedAt: string;
}

export interface ArchiveJournalEntryOptions {
  readonly id?: string;
  readonly archivedAt?: string;
  readonly classificationStatus?: JournalEntryClassificationStatus;
  readonly tags?: readonly string[];
}

export function archiveJournalEntry(
  entry: JournalEntry,
  options: ArchiveJournalEntryOptions = {},
): ArchivedJournalEntry {
  const archivedAt = options.archivedAt ?? new Date().toISOString();
  const metadata = createJournalArchiveMetadata(entry, options);

  return {
    id: options.id ?? crypto.randomUUID(),
    journalEntryId: entry.id,
    rawEntry: copyJournalEntry(entry),
    metadata,
    archivedAt,
  };
}

export function copyArchivedJournalEntry(record: ArchivedJournalEntry): ArchivedJournalEntry {
  return {
    ...record,
    rawEntry: copyJournalEntry(record.rawEntry),
    metadata: {
      ...record.metadata,
      tags: [...record.metadata.tags],
    },
  };
}

export function listArchivedJournalEntries(records: readonly ArchivedJournalEntry[]): ArchivedJournalEntry[] {
  return records.map(copyArchivedJournalEntry);
}

function createJournalArchiveMetadata(
  entry: JournalEntry,
  options: ArchiveJournalEntryOptions,
): JournalArchiveMetadata {
  return {
    classificationStatus: options.classificationStatus ?? entry.classificationStatus,
    tags: normalizeTags(options.tags ?? []),
  };
}

function normalizeTags(tags: readonly string[]): string[] {
  const normalizedTags = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return Array.from(new Set(normalizedTags));
}
