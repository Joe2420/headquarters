import type { IntelligenceEvidenceRecord } from './PatternDetection';

export interface DoctrineSuggestion {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly evidenceRecordIds: readonly string[];
  readonly evidenceSummaries: readonly string[];
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
  const evidenceSummaries = evidenceRecords
    .filter((record) => record.signals.includes(signal))
    .map((record) => record.summary);

  if (evidenceRecordIds.length < minimumEvidenceCount) return undefined;

  return {
    id: `doctrine-suggestion:${signal}`,
    title: signal === 'doctrine_candidate_source' ? 'Review evidence-backed doctrine source' : 'Review repeated lesson for Doctrine',
    rationale: buildDoctrineSuggestionRationale(evidenceSummaries),
    evidenceRecordIds,
    evidenceSummaries,
    requiresManualPromotion: true,
  };
}

function buildDoctrineSuggestionRationale(evidenceSummaries: readonly string[]): string {
  const [firstSummary] = evidenceSummaries;
  if (firstSummary === undefined) return 'Manual doctrine review requires source evidence.';

  return evidenceSummaries.length === 1
    ? `Source evidence requires manual doctrine review: ${firstSummary}`
    : `${evidenceSummaries.length} source records require manual doctrine review. First evidence: ${firstSummary}`;
}
