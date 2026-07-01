import type { AcademyGrowthEvent } from '@headquarters/academy';
import type { IntelligenceEvidenceRecord } from './PatternDetection';

export interface IntelligenceGrowthAnalysis {
  readonly status: 'empty' | 'ready';
  readonly journalEvidenceCount: number;
  readonly academyEvidenceCount: number;
  readonly evidenceRecordIds: readonly string[];
  readonly growthCategories: readonly string[];
  readonly summary: string;
}

export interface IntelligenceGrowthAnalysisInput {
  readonly journalEvidenceRecords?: readonly IntelligenceEvidenceRecord[];
  readonly academyGrowthEvents?: readonly AcademyGrowthEvent[];
}

const journalGrowthSignals = new Set(['growth_event', 'lesson']);

export function analyzeGrowth(input: IntelligenceGrowthAnalysisInput): IntelligenceGrowthAnalysis {
  const journalEvidenceRecords = input.journalEvidenceRecords ?? [];
  const academyGrowthEvents = input.academyGrowthEvents ?? [];
  const journalGrowthEvidence = journalEvidenceRecords.filter((record) => hasGrowthSignal(record));
  const growthCategories = findGrowthCategories(academyGrowthEvents);
  const evidenceRecordIds = [
    ...journalGrowthEvidence.map((record) => record.id),
    ...academyGrowthEvents.map((event) => event.id),
  ].sort((left, right) => left.localeCompare(right));
  const evidenceCount = evidenceRecordIds.length;

  if (evidenceCount === 0) {
    return {
      status: 'empty',
      journalEvidenceCount: 0,
      academyEvidenceCount: 0,
      evidenceRecordIds: [],
      growthCategories: [],
      summary: 'No growth evidence is available for Intelligence analysis yet.',
    };
  }

  return {
    status: 'ready',
    journalEvidenceCount: journalGrowthEvidence.length,
    academyEvidenceCount: academyGrowthEvents.length,
    evidenceRecordIds,
    growthCategories,
    summary: buildGrowthSummary(journalGrowthEvidence.length, academyGrowthEvents.length, growthCategories),
  };
}

function hasGrowthSignal(record: IntelligenceEvidenceRecord): boolean {
  return record.signals.some((signal) => journalGrowthSignals.has(signal));
}

function findGrowthCategories(events: readonly AcademyGrowthEvent[]): readonly string[] {
  return [...new Set(events.map((event) => event.category))].sort((left, right) => left.localeCompare(right));
}

function buildGrowthSummary(
  journalEvidenceCount: number,
  academyEvidenceCount: number,
  growthCategories: readonly string[],
): string {
  const totalEvidenceCount = journalEvidenceCount + academyEvidenceCount;
  const categoryText = growthCategories.length === 0 ? 'no Academy category concentration' : growthCategories.join(', ');

  return `${totalEvidenceCount} evidence record${totalEvidenceCount === 1 ? '' : 's'} support growth analysis with ${categoryText}.`;
}
