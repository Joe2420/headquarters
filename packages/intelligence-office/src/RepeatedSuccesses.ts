import type { IntelligenceEvidenceRecord } from './PatternDetection';

export type RepeatedSuccessSignal = 'growth_event' | 'lesson' | 'doctrine_candidate_source';

export interface RepeatedSuccess {
  readonly id: string;
  readonly signal: RepeatedSuccessSignal;
  readonly title: string;
  readonly behaviorLanguage: string;
  readonly evidenceRecordIds: readonly string[];
}

export interface RepeatedSuccessAnalysisOptions {
  readonly minimumEvidenceCount?: number;
}

const repeatedSuccessSignals: readonly RepeatedSuccessSignal[] = [
  'growth_event',
  'lesson',
  'doctrine_candidate_source',
];

export function analyzeRepeatedSuccesses(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  options: RepeatedSuccessAnalysisOptions = {},
): readonly RepeatedSuccess[] {
  const minimumEvidenceCount = options.minimumEvidenceCount ?? 2;

  return repeatedSuccessSignals
    .map((signal) => buildRepeatedSuccess(signal, evidenceRecords, minimumEvidenceCount))
    .filter((success): success is RepeatedSuccess => success !== undefined)
    .sort((left, right) => left.id.localeCompare(right.id));
}

function buildRepeatedSuccess(
  signal: RepeatedSuccessSignal,
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  minimumEvidenceCount: number,
): RepeatedSuccess | undefined {
  const evidenceRecordIds = evidenceRecords
    .filter((record) => record.signals.includes(signal))
    .map((record) => record.id);

  if (evidenceRecordIds.length < minimumEvidenceCount) return undefined;

  return {
    id: `repeated-success:${signal}`,
    signal,
    title: buildRepeatedSuccessTitle(signal),
    behaviorLanguage: buildBehaviorLanguage(signal, evidenceRecordIds.length),
    evidenceRecordIds,
  };
}

function buildRepeatedSuccessTitle(signal: RepeatedSuccessSignal): string {
  if (signal === 'growth_event') return 'Repeated growth behavior';
  if (signal === 'lesson') return 'Repeated lesson capture';
  return 'Repeated doctrine candidate source';
}

function buildBehaviorLanguage(signal: RepeatedSuccessSignal, count: number): string {
  if (signal === 'growth_event') return `${count} evidence records show repeated growth behavior.`;
  if (signal === 'lesson') return `${count} evidence records show repeated lesson capture.`;
  return `${count} evidence records show repeatable doctrine-source behavior.`;
}
