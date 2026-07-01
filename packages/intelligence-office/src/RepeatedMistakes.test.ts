import { describe, expect, it } from 'vitest';
import type { IntelligenceEvidenceRecord } from './PatternDetection';
import { analyzeRepeatedMistakes } from './RepeatedMistakes';

describe('analyzeRepeatedMistakes', () => {
  it('identifies repeated mistakes with operational language and evidence links', () => {
    const evidenceRecords: readonly IntelligenceEvidenceRecord[] = [
      { id: 'journal-001', sourceType: 'journal', summary: 'First risk note', signals: ['risk_note'] },
      { id: 'journal-002', sourceType: 'journal', summary: 'Second risk note', signals: ['risk_note', 'lesson'] },
      { id: 'archive-001', sourceType: 'archive', summary: 'Archive risk', signals: ['guardian_risk_signal'] },
      { id: 'archive-002', sourceType: 'archive', summary: 'Archive risk again', signals: ['guardian_risk_signal'] },
    ];

    expect(analyzeRepeatedMistakes(evidenceRecords)).toEqual([
      {
        id: 'repeated-mistake:guardian_risk_signal',
        signal: 'guardian_risk_signal',
        title: 'Repeated Guardian risk signal',
        operationalLanguage: '2 evidence records show protective Guardian attention is needed.',
        evidenceRecordIds: ['archive-001', 'archive-002'],
      },
      {
        id: 'repeated-mistake:risk_note',
        signal: 'risk_note',
        title: 'Repeated risk note',
        operationalLanguage: '2 evidence records show risk process requiring review.',
        evidenceRecordIds: ['journal-001', 'journal-002'],
      },
    ]);
  });

  it('handles empty evidence without false repeated mistakes', () => {
    expect(analyzeRepeatedMistakes([])).toEqual([]);
  });
});
