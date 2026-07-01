import { describe, expect, it } from 'vitest';
import type { IntelligenceEvidenceRecord } from './PatternDetection';
import { analyzeRepeatedSuccesses } from './RepeatedSuccesses';

describe('analyzeRepeatedSuccesses', () => {
  it('identifies behavior-based repeated successes with evidence links', () => {
    const evidenceRecords: readonly IntelligenceEvidenceRecord[] = [
      { id: 'journal-001', sourceType: 'journal', summary: 'Patience held', signals: ['growth_event', 'lesson'] },
      { id: 'journal-002', sourceType: 'journal', summary: 'Patience held again', signals: ['growth_event'] },
      { id: 'mission-001', sourceType: 'mission', summary: 'Captured lesson', signals: ['lesson'] },
    ];

    expect(analyzeRepeatedSuccesses(evidenceRecords)).toEqual([
      {
        id: 'repeated-success:growth_event',
        signal: 'growth_event',
        title: 'Repeated growth behavior',
        behaviorLanguage: '2 evidence records show repeated growth behavior.',
        evidenceRecordIds: ['journal-001', 'journal-002'],
      },
      {
        id: 'repeated-success:lesson',
        signal: 'lesson',
        title: 'Repeated lesson capture',
        behaviorLanguage: '2 evidence records show repeated lesson capture.',
        evidenceRecordIds: ['journal-001', 'mission-001'],
      },
    ]);
  });

  it('does not infer financial outcome as success', () => {
    const evidenceRecords: readonly IntelligenceEvidenceRecord[] = [
      { id: 'journal-001', sourceType: 'journal', summary: 'Profit target hit', signals: ['profit'] },
      { id: 'journal-002', sourceType: 'journal', summary: 'Profit target hit again', signals: ['profit'] },
    ];

    expect(analyzeRepeatedSuccesses(evidenceRecords)).toEqual([]);
  });
});
