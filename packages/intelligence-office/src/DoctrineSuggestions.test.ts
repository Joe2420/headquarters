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
        title: 'Review evidence-backed doctrine source',
        rationale: 'Source evidence requires manual doctrine review: Rule source',
        evidenceRecordIds: ['journal-001'],
        evidenceSummaries: ['Rule source'],
        requiresManualPromotion: true,
      },
      {
        id: 'doctrine-suggestion:lesson',
        title: 'Review repeated lesson for Doctrine',
        rationale: '2 source records require manual doctrine review. First evidence: Lesson',
        evidenceRecordIds: ['journal-002', 'mission-001'],
        evidenceSummaries: ['Lesson', 'Lesson again'],
        requiresManualPromotion: true,
      },
    ]);
  });

  it('does not alter doctrine automatically when no evidence exists', () => {
    expect(suggestDoctrineCandidates([])).toEqual([]);
  });
});
