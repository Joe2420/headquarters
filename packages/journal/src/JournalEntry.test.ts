import { describe, expect, it } from 'vitest';
import {
  InMemoryJournalEntryRepository,
  createJournalEntry,
  saveJournalEntry,
} from './JournalEntry';

describe('JournalEntry', () => {
  it('creates a local-first journal entry preserving raw evidence', () => {
    const entry = createJournalEntry(
      {
        content: ' Stayed patient through the open. ',
        entryDate: '2026-06-29',
        mood: ' focused ',
        marketConditions: ' range-bound ',
        attachmentReferences: ['chart-001'],
      },
      {
        id: 'journal-001',
        now: '2026-06-29T10:00:00.000Z',
      },
    );

    expect(entry).toEqual({
      id: 'journal-001',
      entryDate: '2026-06-29',
      rawContent: 'Stayed patient through the open.',
      rawMood: 'focused',
      rawMarketConditions: 'range-bound',
      source: 'manual',
      attachmentReferences: ['chart-001'],
      classificationStatus: 'unclassified',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T10:00:00.000Z',
    });
  });

  it('rejects empty journal entry drafts', () => {
    expect(createJournalEntry({ content: '', entryDate: '2026-06-29' })).toBeUndefined();
    expect(createJournalEntry({ content: 'Entry', entryDate: ' ' })).toBeUndefined();
  });

  it('saves journal entries through an approved repository boundary', async () => {
    const repository = new InMemoryJournalEntryRepository();
    const saved = await saveJournalEntry(
      repository,
      {
        content: 'Protected the original wording.',
        entryDate: '2026-06-29',
      },
      {
        id: 'journal-001',
        now: '2026-06-29T10:00:00.000Z',
      },
    );

    expect(saved?.classificationStatus).toBe('unclassified');
    await expect(repository.getById('journal-001')).resolves.toEqual(saved);
    await expect(repository.list()).resolves.toEqual([saved]);
  });

  it('returns defensive copies from the in-memory repository', async () => {
    const repository = new InMemoryJournalEntryRepository();
    const saved = await saveJournalEntry(
      repository,
      {
        content: 'Original wording remains intact.',
        entryDate: '2026-06-29',
        attachmentReferences: ['chart-001'],
      },
      {
        id: 'journal-001',
        now: '2026-06-29T10:00:00.000Z',
      },
    );

    const loaded = await repository.getById('journal-001');

    expect(loaded).toEqual(saved);
    expect(loaded).not.toBe(saved);
    expect(loaded?.attachmentReferences).not.toBe(saved?.attachmentReferences);
  });
});
