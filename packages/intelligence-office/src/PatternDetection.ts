export type IntelligenceEvidenceSourceType = 'journal' | 'mission' | 'archive';
export type IntelligencePatternKind = 'repeated_signal' | 'source_cluster';

export interface IntelligenceEvidenceRecord {
  readonly id: string;
  readonly sourceType: IntelligenceEvidenceSourceType;
  readonly summary: string;
  readonly signals: readonly string[];
}

export interface IntelligencePattern {
  readonly id: string;
  readonly kind: IntelligencePatternKind;
  readonly label: string;
  readonly evidenceRecordIds: readonly string[];
  readonly explanation: string;
}

export interface IntelligencePatternDetectionOptions {
  readonly minimumEvidenceCount?: number;
}

export function detectIntelligencePatterns(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  options: IntelligencePatternDetectionOptions = {},
): readonly IntelligencePattern[] {
  const minimumEvidenceCount = options.minimumEvidenceCount ?? 2;

  return [
    ...detectRepeatedSignals(evidenceRecords, minimumEvidenceCount),
    ...detectSourceClusters(evidenceRecords, minimumEvidenceCount),
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function detectRepeatedSignals(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  minimumEvidenceCount: number,
): IntelligencePattern[] {
  const evidenceBySignal = new Map<string, string[]>();

  for (const record of evidenceRecords) {
    for (const signal of record.signals) {
      const normalizedSignal = signal.trim().toLowerCase();
      if (normalizedSignal.length === 0) continue;

      evidenceBySignal.set(normalizedSignal, [...(evidenceBySignal.get(normalizedSignal) ?? []), record.id]);
    }
  }

  return Array.from(evidenceBySignal.entries())
    .filter(([, evidenceRecordIds]) => evidenceRecordIds.length >= minimumEvidenceCount)
    .map(([signal, evidenceRecordIds]) => ({
      id: `repeated-signal:${signal}`,
      kind: 'repeated_signal',
      label: `Repeated signal: ${signal}`,
      evidenceRecordIds,
      explanation: `${evidenceRecordIds.length} evidence records share the ${signal} signal.`,
    }));
}

function detectSourceClusters(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  minimumEvidenceCount: number,
): IntelligencePattern[] {
  const evidenceBySource = new Map<IntelligenceEvidenceSourceType, string[]>();

  for (const record of evidenceRecords) {
    evidenceBySource.set(record.sourceType, [...(evidenceBySource.get(record.sourceType) ?? []), record.id]);
  }

  return Array.from(evidenceBySource.entries())
    .filter(([, evidenceRecordIds]) => evidenceRecordIds.length >= minimumEvidenceCount)
    .map(([sourceType, evidenceRecordIds]) => ({
      id: `source-cluster:${sourceType}`,
      kind: 'source_cluster',
      label: `Source cluster: ${sourceType}`,
      evidenceRecordIds,
      explanation: `${evidenceRecordIds.length} evidence records come from approved ${sourceType} evidence.`,
    }));
}
