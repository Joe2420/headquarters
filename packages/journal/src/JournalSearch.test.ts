import { describe, expect, it } from 'vitest';
import { createJournalEntry } from './JournalEntry';
import { hasJournalSearchCriteria, searchJournalEntries } from './JournalSearch';

describe('JournalSearch', () => {
  it('searches journal entries by raw content deterministically', () => {
    const entries = createSearchEntries();

    const result = searchJournalEntries(entries, { text: 'patience' });

    expect(result.total).toBe(1);
    expect(result.entries.map((entry) => entry.id)).toEqual(['journal-001']);
  });

  it('searches journal entries by approved metadata fields', () => {
    const entries = createSearchEntries();

    const result = searchJournalEntries(entries, {
      entryDate: '2026-06-30',
      mood: 'focused',
      marketConditions: 'trend',
      source: 'manual',
    });

    expect(result.entries.map((entry) => entry.id)).toEqual(['journal-002']);
  });

  it('returns an empty result when no journal entry matches', () => {
    const entries = createSearchEntries();

    const result = searchJournalEntries(entries, { text: 'not present' });

    expect(result).toEqual({
      entries: [],
      total: 0,
    });
  });

  it('returns defensive entry copies without mutating source entries', () => {
    const entries = createSearchEntries();

    const result = searchJournalEntries(entries, {});
    const firstResult = result.entries[0];
    const firstSource = entries[0];
    if (firstResult === undefined || firstSource === undefined) throw new Error('Expected search fixtures');

    expect(result.entries.map((entry) => entry.id)).toEqual(['journal-001', 'journal-002']);
    expect(firstResult).not.toBe(firstSource);
    expect(firstResult.attachmentReferences).not.toBe(firstSource.attachmentReferences);
  });

  it('detects whether a query contains usable criteria', () => {
    expect(hasJournalSearchCriteria({ text: '   ' })).toBe(false);
    expect(hasJournalSearchCriteria({ mood: 'Calm' })).toBe(true);
  });
});

function createSearchEntries() {
  const first = createJournalEntry(
    {
      content: 'Practiced patience before entry.',
      entryDate: '2026-06-29',
      mood: 'Calm',
      marketConditions: 'Range',
      source: 'production_export',
      attachmentReferences: ['chart-001'],
    },
    {
      id: 'journal-001',
      now: '2026-06-29T20:00:00.000Z',
    },
  );
  const second = createJournalEntry(
    {
      content: 'Protected risk with a clear stop.',
      entryDate: '2026-06-30',
      mood: 'Focused',
      marketConditions: 'Trend day',
      source: 'manual',
      attachmentReferences: ['chart-002'],
    },
    {
      id: 'journal-002',
      now: '2026-06-30T20:00:00.000Z',
    },
  );
  if (first === undefined || second === undefined) throw new Error('Expected journal entry fixtures');

  return [first, second];
}
