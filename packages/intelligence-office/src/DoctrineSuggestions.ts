import type { IntelligenceEvidenceRecord } from './PatternDetection';

export interface DoctrineSuggestion {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly evidenceRecordIds: readonly string[];
  readonly requiresManualPromotion: true;
}

export interface DoctrineSuggestionOptions {
  readonly minimumEvidenceCount?: number;
}

export function suggestDoctrineCandidates(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  options: DoctrineSuggestionOptions = {},
): readonly DoctrineSuggestion[] {
  const minimumEvidenceCount = options.minimumEvidenceCount ?? 1;
  const candidates = [
    buildSuggestionForSignal('doctrine_candidate_source', evidenceRecords, minimumEvidenceCount),
    buildSuggestionForSignal('lesson', evidenceRecords, minimumEvidenceCount + 1),
  ];

  return candidates
    .filter((suggestion): suggestion is DoctrineSuggestion => suggestion !== undefined)
    .sort((left, right) => left.id.localeCompare(right.id));
}

function buildSuggestionForSignal(
  signal: string,
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  minimumEvidenceCount: number,
): DoctrineSuggestion | undefined {
  const evidenceRecordIds = evidenceRecords
    .filter((record) => record.signals.includes(signal))
    .map((record) => record.id);

  if (evidenceRecordIds.length < minimumEvidenceCount) return undefined;

  return {
    id: `doctrine-suggestion:${signal}`,
    title: signal === 'doctrine_candidate_source' ? 'Review doctrine candidate source' : 'Review repeated lesson',
    rationale: `${evidenceRecordIds.length} evidence record${evidenceRecordIds.length === 1 ? '' : 's'} support manual doctrine review.`,
    evidenceRecordIds,
    requiresManualPromotion: true,
  };
}
