import { describe, expect, it } from 'vitest';
import type { IntelligenceEvidenceRecord } from './PatternDetection';
import { suggestDoctrineCandidates } from './DoctrineSuggestions';

describe('suggestDoctrineCandidates', () => {
  it('creates traceable doctrine suggestions that require manual promotion', () => {
    const evidenceRecords: readonly IntelligenceEvidenceRecord[] = [
      { id: 'journal-001', sourceType: 'journal', summary: 'Rule source', signals: ['doctrine_candidate_source'] },
      { id: 'journal-002', sourceType: 'journal', summary: 'Lesson', signals: ['lesson'] },
      { id: 'mission-001', sourceType: 'mission', summary: 'Lesson again', signals: ['lesson'] },
    ];

    expect(suggestDoctrineCandidates(evidenceRecords)).toEqual([
      {
        id: 'doctrine-suggestion:doctrine_candidate_source',
        title: 'Doctrine candidate requires review',
        rationale: '1 supporting source surfaced a possible operating rule. Review it before it becomes Doctrine.',
        evidenceRecordIds: ['journal-001'],
        requiresManualPromotion: true,
      },
      {
        id: 'doctrine-suggestion:lesson',
        title: 'Repeated lesson requires review',
        rationale: '2 supporting sources repeated the same lesson. Decide whether it belongs in Doctrine.',
        evidenceRecordIds: ['journal-002', 'mission-001'],
        requiresManualPromotion: true,
      },
    ]);
  });

  it('does not alter doctrine automatically when no evidence exists', () => {
    expect(suggestDoctrineCandidates([])).toEqual([]);
  });
});
