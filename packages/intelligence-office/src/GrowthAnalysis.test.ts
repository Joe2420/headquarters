import { describe, expect, it } from 'vitest';
import type { AcademyGrowthEvent } from '@headquarters/academy';
import type { IntelligenceEvidenceRecord } from './PatternDetection';
import { analyzeGrowth } from './GrowthAnalysis';

describe('analyzeGrowth', () => {
  it('produces deterministic evidence-based growth analysis from journal and Academy evidence', () => {
    const journalEvidenceRecords: readonly IntelligenceEvidenceRecord[] = [
      { id: 'journal-002', sourceType: 'journal', summary: 'Lesson captured', signals: ['lesson'] },
      { id: 'journal-001', sourceType: 'journal', summary: 'Risk note', signals: ['risk_note'] },
      { id: 'journal-003', sourceType: 'journal', summary: 'Growth event', signals: ['growth_event'] },
    ];
    const academyGrowthEvents: readonly AcademyGrowthEvent[] = [
      createAcademyGrowthEvent('academy-002', 'patience'),
      createAcademyGrowthEvent('academy-001', 'discipline'),
      createAcademyGrowthEvent('academy-003', 'discipline'),
    ];

    expect(analyzeGrowth({ journalEvidenceRecords, academyGrowthEvents })).toEqual({
      status: 'ready',
      journalEvidenceCount: 2,
      academyEvidenceCount: 3,
      evidenceRecordIds: ['academy-001', 'academy-002', 'academy-003', 'journal-002', 'journal-003'],
      growthCategories: ['discipline', 'patience'],
      summary: '5 evidence records support growth analysis with discipline, patience.',
    });
  });

  it('handles empty growth evidence without inference', () => {
    expect(analyzeGrowth({ journalEvidenceRecords: [], academyGrowthEvents: [] })).toEqual({
      status: 'empty',
      journalEvidenceCount: 0,
      academyEvidenceCount: 0,
      evidenceRecordIds: [],
      growthCategories: [],
      summary: 'No growth evidence is available for Intelligence analysis yet.',
    });
  });
});

function createAcademyGrowthEvent(
  id: string,
  category: AcademyGrowthEvent['category'],
): AcademyGrowthEvent {
  return {
    id,
    occurredOn: '2026-07-01',
    title: `${category} growth`,
    description: 'Evidence-backed growth event.',
    category,
    evidence: {
      sourceType: 'journal_growth_event',
      growthEventId: id,
      journalSourceType: 'journal_entry',
      journalSourceId: `journal-${id}`,
    },
    createdAt: '2026-07-01T08:00:00.000Z',
  };
}
