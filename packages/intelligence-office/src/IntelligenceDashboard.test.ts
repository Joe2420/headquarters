import { describe, expect, it } from 'vitest';
import { buildIntelligenceDashboard } from './IntelligenceDashboard';

describe('buildIntelligenceDashboard', () => {
  it('summarizes all Intelligence outputs without mutating source arrays', () => {
    const patternReports = [{
      id: 'pattern-001',
      kind: 'repeated_signal' as const,
      label: 'Repeated signal',
      explanation: 'Two evidence records share a signal.',
      evidenceRecordIds: ['journal-001', 'journal-002'],
    }];
    const repeatedMistakes = [{
      id: 'mistake-001',
      signal: 'risk_note' as const,
      title: 'Repeated risk note',
      operationalLanguage: 'Risk process requires review.',
      evidenceRecordIds: ['journal-001', 'journal-002'],
    }];
    const repeatedSuccesses = [{
      id: 'success-001',
      signal: 'growth_event' as const,
      title: 'Repeated growth behavior',
      behaviorLanguage: 'Growth behavior repeated.',
      evidenceRecordIds: ['journal-003', 'journal-004'],
    }];
    const doctrineSuggestions = [{
      id: 'suggestion-001',
      title: 'Doctrine candidate requires review',
      rationale: 'Evidence supports manual review.',
      evidenceRecordIds: ['journal-005'],
      requiresManualPromotion: true as const,
    }];

    const dashboard = buildIntelligenceDashboard({
      classificationCount: 3,
      patternReports,
      repeatedMistakes,
      repeatedSuccesses,
      doctrineSuggestions,
      growthAnalysis: {
        status: 'ready',
        journalEvidenceCount: 2,
        academyEvidenceCount: 1,
        evidenceRecordIds: ['journal-003', 'academy-001'],
        growthCategories: ['discipline'],
        summary: 'Growth evidence ready.',
      },
    });

    expect(dashboard).toEqual({
      status: 'ready',
      classificationCount: 3,
      patternReportCount: 1,
      repeatedMistakeCount: 1,
      repeatedSuccessCount: 1,
      doctrineSuggestionCount: 1,
      growthEvidenceCount: 3,
      summary: '3 classifications active; 1 pattern report active; 3 growth evidence records',
    });
    expect(patternReports).toHaveLength(1);
    expect(doctrineSuggestions[0]?.requiresManualPromotion).toBe(true);
  });

  it('supports an empty dashboard state', () => {
    expect(buildIntelligenceDashboard({
      classificationCount: 0,
      patternReports: [],
      repeatedMistakes: [],
      repeatedSuccesses: [],
      doctrineSuggestions: [],
      growthAnalysis: {
        status: 'empty',
        journalEvidenceCount: 0,
        academyEvidenceCount: 0,
        evidenceRecordIds: [],
        growthCategories: [],
        summary: 'No growth evidence is available for Intelligence analysis yet.',
      },
    })).toEqual({
      status: 'empty',
      classificationCount: 0,
      patternReportCount: 0,
      repeatedMistakeCount: 0,
      repeatedSuccessCount: 0,
      doctrineSuggestionCount: 0,
      growthEvidenceCount: 0,
      summary: 'No Intelligence Office signals are available yet.',
    });
  });
});
