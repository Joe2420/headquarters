import { describe, expect, it } from 'vitest';
import type { IntelligenceEvidenceRecord } from './PatternDetection';
import { detectIntelligencePatterns } from './PatternDetection';

const evidenceRecords: readonly IntelligenceEvidenceRecord[] = [
  {
    id: 'journal-001',
    sourceType: 'journal',
    summary: 'First journal classification',
    signals: ['growth_event', 'lesson'],
  },
  {
    id: 'journal-002',
    sourceType: 'journal',
    summary: 'Second journal classification',
    signals: ['growth_event', 'risk_note'],
  },
  {
    id: 'mission-001',
    sourceType: 'mission',
    summary: 'Mission evidence',
    signals: ['authorization'],
  },
];

describe('detectIntelligencePatterns', () => {
  it('detects explainable repeated signals and source clusters from approved evidence', () => {
    expect(detectIntelligencePatterns(evidenceRecords)).toEqual([
      {
        id: 'repeated-signal:growth_event',
        kind: 'repeated_signal',
        label: 'Repeated signal: growth_event',
        evidenceRecordIds: ['journal-001', 'journal-002'],
        explanation: '2 evidence records share the growth_event signal.',
      },
      {
        id: 'source-cluster:journal',
        kind: 'source_cluster',
        label: 'Source cluster: journal',
        evidenceRecordIds: ['journal-001', 'journal-002'],
        explanation: '2 evidence records come from approved journal evidence.',
      },
    ]);
  });

  it('returns no patterns when evidence does not meet the threshold', () => {
    expect(detectIntelligencePatterns(evidenceRecords, { minimumEvidenceCount: 4 })).toEqual([]);
  });
});
