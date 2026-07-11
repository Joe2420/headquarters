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
    title: signal === 'doctrine_candidate_source' ? 'Doctrine candidate requires review' : 'Repeated lesson requires review',
    rationale: formatDoctrineSuggestionRationale(signal, evidenceRecordIds.length),
    evidenceRecordIds,
    requiresManualPromotion: true,
  };
}

function formatDoctrineSuggestionRationale(signal: string, evidenceCount: number): string {
  const evidenceText = `${evidenceCount} supporting ${evidenceCount === 1 ? 'source' : 'sources'}`;
  if (signal === 'doctrine_candidate_source') {
    return `${evidenceText} surfaced a possible operating rule. Review it before it becomes Doctrine.`;
  }

  return `${evidenceText} repeated the same lesson. Decide whether it belongs in Doctrine.`;
}
