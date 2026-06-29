import { describe, expect, it } from 'vitest';
import { createJournalEntry } from './JournalEntry';
import {
  archiveJournalEntry,
  copyArchivedJournalEntry,
  listArchivedJournalEntries,
} from './JournalArchive';

describe('JournalArchive', () => {
  it('archives a journal entry as immutable raw evidence plus separate metadata', () => {
    const entry = createJournalEntry(
      {
        content: 'Raw evidence stays intact.',
        entryDate: '2026-06-29',
        mood: 'Calm',
        marketConditions: 'Range',
        attachmentReferences: ['chart-001'],
      },
      {
        id: 'journal-001',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    if (entry === undefined) throw new Error('Expected journal entry');

    const archived = archiveJournalEntry(entry, {
      id: 'archive-001',
      archivedAt: '2026-06-30T20:00:00.000Z',
      classificationStatus: 'classified',
      tags: ['discipline', ' discipline ', ''],
    });

    expect(archived).toEqual({
      id: 'archive-001',
      journalEntryId: 'journal-001',
      rawEntry: entry,
      metadata: {
        classificationStatus: 'classified',
        tags: ['discipline'],
      },
      archivedAt: '2026-06-30T20:00:00.000Z',
    });
    expect(archived.rawEntry.classificationStatus).toBe('unclassified');
    expect(entry.classificationStatus).toBe('unclassified');
  });

  it('returns defensive copies of archived journal entries', () => {
    const entry = createJournalEntry(
      {
        content: 'Copy archive evidence.',
        entryDate: '2026-06-29',
        attachmentReferences: ['chart-001'],
      },
      {
        id: 'journal-001',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    if (entry === undefined) throw new Error('Expected journal entry');
    const archived = archiveJournalEntry(entry, {
      id: 'archive-001',
      archivedAt: '2026-06-30T20:00:00.000Z',
      tags: ['reviewed'],
    });

    const copy = copyArchivedJournalEntry(archived);

    expect(copy).toEqual(archived);
    expect(copy).not.toBe(archived);
    expect(copy.rawEntry).not.toBe(archived.rawEntry);
    expect(copy.rawEntry.attachmentReferences).not.toBe(archived.rawEntry.attachmentReferences);
    expect(copy.metadata.tags).not.toBe(archived.metadata.tags);
  });

  it('lists archived entries without exposing source references', () => {
    const entry = createJournalEntry(
      {
        content: 'Listed archive evidence.',
        entryDate: '2026-06-29',
      },
      {
        id: 'journal-001',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    if (entry === undefined) throw new Error('Expected journal entry');
    const archived = archiveJournalEntry(entry, {
      id: 'archive-001',
      archivedAt: '2026-06-30T20:00:00.000Z',
    });

    const listed = listArchivedJournalEntries([archived]);
    const first = listed[0];
    if (first === undefined) throw new Error('Expected archived entry');

    expect(first).toEqual(archived);
    expect(first).not.toBe(archived);
  });
});
