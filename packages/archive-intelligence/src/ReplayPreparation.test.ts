import { describe, expect, it } from 'vitest';
import type { ArchiveIntelligenceRecord } from './ArchiveSearch';
import { prepareArchiveReplay } from './ReplayPreparation';

const records: readonly ArchiveIntelligenceRecord[] = [
  {
    id: 'journal-2',
    type: 'journal',
    title: 'Second journal entry',
    summary: 'Later reflection',
    occurredAt: '2026-01-03T09:00:00.000Z',
    tags: ['reflection'],
  },
  {
    id: 'mission-1',
    type: 'mission',
    title: 'First mission',
    summary: 'Mission started',
    occurredAt: '2026-01-01T09:00:00.000Z',
    tags: ['mission'],
  },
  {
    id: 'academy-1',
    type: 'academy',
    title: 'Same-time academy note',
    summary: 'Tie-breaker record',
    occurredAt: '2026-01-01T09:00:00.000Z',
    tags: ['growth'],
  },
];

describe('prepareArchiveReplay', () => {
  it('produces deterministic replay preparation data in chronological order', () => {
    const preparation = prepareArchiveReplay(records, '2026-02-01T00:00:00.000Z');

    expect(preparation).toEqual({
      totalItems: 3,
      preparedAt: '2026-02-01T00:00:00.000Z',
      items: [
        {
          sequence: 1,
          recordId: 'academy-1',
          occurredAt: '2026-01-01T09:00:00.000Z',
          recordType: 'academy',
          title: 'Same-time academy note',
          summary: 'Tie-breaker record',
          tags: ['growth'],
        },
        {
          sequence: 2,
          recordId: 'mission-1',
          occurredAt: '2026-01-01T09:00:00.000Z',
          recordType: 'mission',
          title: 'First mission',
          summary: 'Mission started',
          tags: ['mission'],
        },
        {
          sequence: 3,
          recordId: 'journal-2',
          occurredAt: '2026-01-03T09:00:00.000Z',
          recordType: 'journal',
          title: 'Second journal entry',
          summary: 'Later reflection',
          tags: ['reflection'],
        },
      ],
    });
  });

  it('handles empty archive data without introducing replay playback behavior', () => {
    expect(prepareArchiveReplay([], '2026-02-01T00:00:00.000Z')).toEqual({
      totalItems: 0,
      preparedAt: '2026-02-01T00:00:00.000Z',
      items: [],
    });
  });
});
