import type { DoctrineSuggestion } from './DoctrineSuggestions';
import type { IntelligenceGrowthAnalysis } from './GrowthAnalysis';
import type { IntelligencePattern } from './PatternDetection';
import type { RepeatedMistake } from './RepeatedMistakes';
import type { RepeatedSuccess } from './RepeatedSuccesses';

export interface IntelligenceDashboardInput {
  readonly classificationCount: number;
  readonly patternReports: readonly IntelligencePattern[];
  readonly repeatedMistakes: readonly RepeatedMistake[];
  readonly repeatedSuccesses: readonly RepeatedSuccess[];
  readonly doctrineSuggestions: readonly DoctrineSuggestion[];
  readonly growthAnalysis: IntelligenceGrowthAnalysis;
}

export interface IntelligenceDashboard {
  readonly status: 'empty' | 'ready';
  readonly classificationCount: number;
  readonly patternReportCount: number;
  readonly repeatedMistakeCount: number;
  readonly repeatedSuccessCount: number;
  readonly doctrineSuggestionCount: number;
  readonly growthEvidenceCount: number;
  readonly summary: string;
}

export function buildIntelligenceDashboard(input: IntelligenceDashboardInput): IntelligenceDashboard {
  const patternReportCount = input.patternReports.length;
  const repeatedMistakeCount = input.repeatedMistakes.length;
  const repeatedSuccessCount = input.repeatedSuccesses.length;
  const doctrineSuggestionCount = input.doctrineSuggestions.length;
  const growthEvidenceCount = input.growthAnalysis.journalEvidenceCount + input.growthAnalysis.academyEvidenceCount;
  const totalSignalCount = input.classificationCount
    + patternReportCount
    + repeatedMistakeCount
    + repeatedSuccessCount
    + doctrineSuggestionCount
    + growthEvidenceCount;

  if (totalSignalCount === 0) {
    return {
      status: 'empty',
      classificationCount: 0,
      patternReportCount: 0,
      repeatedMistakeCount: 0,
      repeatedSuccessCount: 0,
      doctrineSuggestionCount: 0,
      growthEvidenceCount: 0,
      summary: 'No Intelligence Office signals are available yet.',
    };
  }

  return {
    status: 'ready',
    classificationCount: input.classificationCount,
    patternReportCount,
    repeatedMistakeCount,
    repeatedSuccessCount,
    doctrineSuggestionCount,
    growthEvidenceCount,
    summary: [
      `${input.classificationCount} classification${input.classificationCount === 1 ? '' : 's'}`,
      `${patternReportCount} pattern report${patternReportCount === 1 ? '' : 's'}`,
      `${growthEvidenceCount} growth evidence record${growthEvidenceCount === 1 ? '' : 's'}`,
    ].join(' active; '),
  };
}
