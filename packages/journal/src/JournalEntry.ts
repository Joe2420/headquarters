import type { ISODateTime, UUID } from '@headquarters/shared';

export type JournalEntrySource = 'manual' | 'production_export';
export type JournalEntryClassificationStatus = 'unclassified' | 'classified';

export interface JournalEntryDraft {
  readonly content: string;
  readonly entryDate: string;
  readonly mood?: string;
  readonly marketConditions?: string;
  readonly source?: JournalEntrySource;
  readonly attachmentReferences?: readonly string[];
}

export interface JournalEntry {
  readonly id: UUID;
  readonly entryDate: string;
  readonly rawContent: string;
  readonly rawMood?: string;
  readonly rawMarketConditions?: string;
  readonly source: JournalEntrySource;
  readonly attachmentReferences: readonly string[];
  readonly classificationStatus: JournalEntryClassificationStatus;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface JournalEntryRepository {
  save(entry: JournalEntry): Promise<JournalEntry>;
  getById(id: UUID): Promise<JournalEntry | undefined>;
  list(): Promise<JournalEntry[]>;
}

export interface CreateJournalEntryOptions {
  readonly id?: UUID;
  readonly now?: ISODateTime;
}

export class InMemoryJournalEntryRepository implements JournalEntryRepository {
  readonly #entries = new Map<UUID, JournalEntry>();

  async save(entry: JournalEntry): Promise<JournalEntry> {
    this.#entries.set(entry.id, copyJournalEntry(entry));
    return copyJournalEntry(entry);
  }

  async getById(id: UUID): Promise<JournalEntry | undefined> {
    const entry = this.#entries.get(id);
    return entry ? copyJournalEntry(entry) : undefined;
  }

  async list(): Promise<JournalEntry[]> {
    return Array.from(this.#entries.values()).map(copyJournalEntry);
  }
}

export function createJournalEntry(draft: JournalEntryDraft, options: CreateJournalEntryOptions = {}): JournalEntry | undefined {
  const rawContent = draft.content.trim();
  const entryDate = draft.entryDate.trim();

  if (!rawContent || !entryDate) return undefined;

  const timestamp = options.now ?? new Date().toISOString();
  const rawMood = normalizeOptionalText(draft.mood);
  const rawMarketConditions = normalizeOptionalText(draft.marketConditions);

  return {
    id: options.id ?? crypto.randomUUID(),
    entryDate,
    rawContent,
    ...(rawMood !== undefined ? { rawMood } : {}),
    ...(rawMarketConditions !== undefined ? { rawMarketConditions } : {}),
    source: draft.source ?? 'manual',
    attachmentReferences: [...(draft.attachmentReferences ?? [])],
    classificationStatus: 'unclassified',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function saveJournalEntry(
  repository: JournalEntryRepository,
  draft: JournalEntryDraft,
  options: CreateJournalEntryOptions = {},
): Promise<JournalEntry | undefined> {
  const entry = createJournalEntry(draft, options);
  if (entry === undefined) return undefined;
  return repository.save(entry);
}

export function copyJournalEntry(entry: JournalEntry): JournalEntry {
  return {
    ...entry,
    attachmentReferences: [...entry.attachmentReferences],
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
