import type { ArchiveIntelligenceRecord, ArchiveRecordType } from './ArchiveSearch';

export type ArchivePatternKind = 'repeated_tag' | 'record_type_cluster';

export interface ArchivePattern {
  readonly id: string;
  readonly kind: ArchivePatternKind;
  readonly label: string;
  readonly evidenceRecordIds: readonly string[];
  readonly explanation: string;
}

export interface ArchivePatternDetectionOptions {
  readonly minimumEvidenceCount?: number;
}

export function detectArchivePatterns(
  records: readonly ArchiveIntelligenceRecord[],
  options: ArchivePatternDetectionOptions = {},
): readonly ArchivePattern[] {
  const minimumEvidenceCount = options.minimumEvidenceCount ?? 2;

  return [
    ...detectRepeatedTagPatterns(records, minimumEvidenceCount),
    ...detectRecordTypeClusters(records, minimumEvidenceCount),
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function detectRepeatedTagPatterns(records: readonly ArchiveIntelligenceRecord[], minimumEvidenceCount: number): ArchivePattern[] {
  const evidenceByTag = new Map<string, string[]>();

  for (const record of records) {
    for (const tag of record.tags) {
      const normalizedTag = tag.trim().toLowerCase();
      if (normalizedTag.length === 0) continue;

      evidenceByTag.set(normalizedTag, [...(evidenceByTag.get(normalizedTag) ?? []), record.id]);
    }
  }

  return Array.from(evidenceByTag.entries())
    .filter(([, evidenceRecordIds]) => evidenceRecordIds.length >= minimumEvidenceCount)
    .map(([tag, evidenceRecordIds]) => ({
      id: `repeated-tag:${tag}`,
      kind: 'repeated_tag',
      label: `Repeated tag: ${tag}`,
      evidenceRecordIds,
      explanation: `${evidenceRecordIds.length} archive records share the ${tag} tag.`,
    }));
}

function detectRecordTypeClusters(records: readonly ArchiveIntelligenceRecord[], minimumEvidenceCount: number): ArchivePattern[] {
  const evidenceByType = new Map<ArchiveRecordType, string[]>();

  for (const record of records) {
    evidenceByType.set(record.type, [...(evidenceByType.get(record.type) ?? []), record.id]);
  }

  return Array.from(evidenceByType.entries())
    .filter(([, evidenceRecordIds]) => evidenceRecordIds.length >= minimumEvidenceCount)
    .map(([type, evidenceRecordIds]) => ({
      id: `record-type-cluster:${type}`,
      kind: 'record_type_cluster',
      label: `Record type cluster: ${type}`,
      evidenceRecordIds,
      explanation: `${evidenceRecordIds.length} archive records are ${type} records.`,
    }));
}
