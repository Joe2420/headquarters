import {
  copyJournalEntry,
  type JournalEntry,
  type JournalEntrySource,
} from './JournalEntry';

export interface JournalSearchQuery {
  readonly text?: string;
  readonly entryDate?: string;
  readonly mood?: string;
  readonly marketConditions?: string;
  readonly source?: JournalEntrySource;
}

export interface JournalSearchResult {
  readonly entries: readonly JournalEntry[];
  readonly total: number;
}

export function searchJournalEntries(
  entries: readonly JournalEntry[],
  query: JournalSearchQuery,
): JournalSearchResult {
  const normalizedQuery = normalizeJournalSearchQuery(query);
  const matchingEntries = entries
    .filter((entry) => matchesJournalSearchQuery(entry, normalizedQuery))
    .map(copyJournalEntry);

  return {
    entries: matchingEntries,
    total: matchingEntries.length,
  };
}

export function hasJournalSearchCriteria(query: JournalSearchQuery): boolean {
  const normalizedQuery = normalizeJournalSearchQuery(query);

  return normalizedQuery.text !== undefined
    || normalizedQuery.entryDate !== undefined
    || normalizedQuery.mood !== undefined
    || normalizedQuery.marketConditions !== undefined
    || normalizedQuery.source !== undefined;
}

interface NormalizedJournalSearchQuery {
  readonly text?: string;
  readonly entryDate?: string;
  readonly mood?: string;
  readonly marketConditions?: string;
  readonly source?: JournalEntrySource;
}

function matchesJournalSearchQuery(
  entry: JournalEntry,
  query: NormalizedJournalSearchQuery,
): boolean {
  if (query.text !== undefined && !entry.rawContent.toLowerCase().includes(query.text)) return false;
  if (query.entryDate !== undefined && entry.entryDate !== query.entryDate) return false;
  if (query.mood !== undefined && !matchesOptionalText(entry.rawMood, query.mood)) return false;
  if (
    query.marketConditions !== undefined
    && !matchesOptionalText(entry.rawMarketConditions, query.marketConditions)
  ) {
    return false;
  }
  if (query.source !== undefined && entry.source !== query.source) return false;

  return true;
}

function normalizeJournalSearchQuery(query: JournalSearchQuery): NormalizedJournalSearchQuery {
  const text = normalizeSearchText(query.text);
  const entryDate = normalizeExactText(query.entryDate);
  const mood = normalizeSearchText(query.mood);
  const marketConditions = normalizeSearchText(query.marketConditions);

  return {
    ...(text !== undefined ? { text } : {}),
    ...(entryDate !== undefined ? { entryDate } : {}),
    ...(mood !== undefined ? { mood } : {}),
    ...(marketConditions !== undefined ? { marketConditions } : {}),
    ...(query.source !== undefined ? { source: query.source } : {}),
  };
}

function matchesOptionalText(value: string | undefined, expected: string): boolean {
  return value?.toLowerCase().includes(expected) ?? false;
}

function normalizeSearchText(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : undefined;
}

function normalizeExactText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
