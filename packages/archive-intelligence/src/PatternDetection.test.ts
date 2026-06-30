import { describe, expect, it } from 'vitest';
import type { ArchiveIntelligenceRecord } from './ArchiveSearch';
import { detectArchivePatterns } from './PatternDetection';

const records: readonly ArchiveIntelligenceRecord[] = [
  {
    id: 'mission-1',
    type: 'mission',
    title: 'First mission',
    summary: 'A mission record',
    occurredAt: '2026-01-01T09:00:00.000Z',
    tags: ['discipline', 'session'],
  },
  {
    id: 'journal-1',
    type: 'journal',
    title: 'Journal reflection',
    summary: 'A journal record',
    occurredAt: '2026-01-02T09:00:00.000Z',
    tags: ['discipline'],
  },
  {
    id: 'mission-2',
    type: 'mission',
    title: 'Second mission',
    summary: 'Another mission record',
    occurredAt: '2026-01-03T09:00:00.000Z',
    tags: ['review'],
  },
];

describe('detectArchivePatterns', () => {
  it('detects explainable repeated tag and record type patterns with traceable evidence', () => {
    expect(detectArchivePatterns(records)).toEqual([
      {
        id: 'record-type-cluster:mission',
        kind: 'record_type_cluster',
        label: 'Record type cluster: mission',
        evidenceRecordIds: ['mission-1', 'mission-2'],
        explanation: '2 archive records are mission records.',
      },
      {
        id: 'repeated-tag:discipline',
        kind: 'repeated_tag',
        label: 'Repeated tag: discipline',
        evidenceRecordIds: ['mission-1', 'journal-1'],
        explanation: '2 archive records share the discipline tag.',
      },
    ]);
  });

  it('returns no patterns when evidence does not meet the threshold', () => {
    expect(detectArchivePatterns(records, { minimumEvidenceCount: 4 })).toEqual([]);
  });
});
