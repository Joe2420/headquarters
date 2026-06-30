import { describe, expect, it } from 'vitest';
import { searchArchiveRecords, type ArchiveIntelligenceRecord } from './ArchiveSearch';

const records: ArchiveIntelligenceRecord[] = [
  {
    id: 'mission-001',
    type: 'mission',
    title: 'Opening Range Mission',
    summary: 'Disciplined observation and return to base.',
    occurredAt: '2026-06-28T09:00:00.000Z',
    tags: ['discipline', 'observation'],
  },
  {
    id: 'journal-001',
    type: 'journal',
    title: 'Daily Reflection',
    summary: 'Noted fatigue before execution.',
    occurredAt: '2026-06-28T18:00:00.000Z',
    tags: ['fatigue'],
  },
];

describe('Archive advanced search', () => {
  it('searches approved archive fields deterministically', () => {
    expect(searchArchiveRecords(records, { text: 'observation' }).map((record) => record.id)).toEqual(['mission-001']);
    expect(searchArchiveRecords(records, { type: 'journal' }).map((record) => record.id)).toEqual(['journal-001']);
    expect(searchArchiveRecords(records, { tag: 'discipline' }).map((record) => record.id)).toEqual(['mission-001']);
  });

  it('handles empty results without mutation', () => {
    expect(searchArchiveRecords(records, { text: 'not-present' })).toEqual([]);
    expect(records).toHaveLength(2);
  });
});
