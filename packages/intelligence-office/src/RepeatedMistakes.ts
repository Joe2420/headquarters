import type { IntelligenceEvidenceRecord } from './PatternDetection';

export type RepeatedMistakeSignal = 'risk_note' | 'guardian_risk_signal' | 'emotional_state';

export interface RepeatedMistake {
  readonly id: string;
  readonly signal: RepeatedMistakeSignal;
  readonly title: string;
  readonly operationalLanguage: string;
  readonly evidenceRecordIds: readonly string[];
}

export interface RepeatedMistakeAnalysisOptions {
  readonly minimumEvidenceCount?: number;
}

const repeatedMistakeSignals: readonly RepeatedMistakeSignal[] = [
  'risk_note',
  'guardian_risk_signal',
  'emotional_state',
];

export function analyzeRepeatedMistakes(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  options: RepeatedMistakeAnalysisOptions = {},
): readonly RepeatedMistake[] {
  const minimumEvidenceCount = options.minimumEvidenceCount ?? 2;

  return repeatedMistakeSignals
    .map((signal) => buildRepeatedMistake(signal, evidenceRecords, minimumEvidenceCount))
    .filter((mistake): mistake is RepeatedMistake => mistake !== undefined)
    .sort((left, right) => left.id.localeCompare(right.id));
}

function buildRepeatedMistake(
  signal: RepeatedMistakeSignal,
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  minimumEvidenceCount: number,
): RepeatedMistake | undefined {
  const evidenceRecordIds = evidenceRecords
    .filter((record) => record.signals.includes(signal))
    .map((record) => record.id);

  if (evidenceRecordIds.length < minimumEvidenceCount) return undefined;

  return {
    id: `repeated-mistake:${signal}`,
    signal,
    title: buildRepeatedMistakeTitle(signal),
    operationalLanguage: buildOperationalLanguage(signal, evidenceRecordIds.length),
    evidenceRecordIds,
  };
}

function buildRepeatedMistakeTitle(signal: RepeatedMistakeSignal): string {
  if (signal === 'risk_note') return 'Repeated risk note';
  if (signal === 'guardian_risk_signal') return 'Repeated Guardian risk signal';
  return 'Repeated emotional state signal';
}

function buildOperationalLanguage(signal: RepeatedMistakeSignal, count: number): string {
  if (signal === 'risk_note') return `${count} evidence records show risk process requiring review.`;
  if (signal === 'guardian_risk_signal') return `${count} evidence records show protective Guardian attention is needed.`;
  return `${count} evidence records show emotional state deserves pre-mission mitigation.`;
}
