import type { GrowthEventCategory } from '@headquarters/journal';
import type { AcademyGrowthEvent, AcademyGrowthEventEvidence } from './AcademyGrowthEvent';
import { resolveAcademyLevel, type AcademyLevelProgress } from './AcademyLevel';
import { buildAcademyRecognitions } from './AcademyRecognition';
import { calculateAcademyXp } from './AcademyXpEngine';

export interface AcademyStatistics {
  readonly totalGrowthEvents: number;
  readonly totalXp: number;
  readonly level: AcademyLevelProgress;
  readonly recognitionCount: number;
  readonly categoryCounts: Readonly<Record<GrowthEventCategory, number>>;
  readonly evidenceSourceCounts: Readonly<Record<AcademyGrowthEventEvidence['sourceType'], number>>;
  readonly hasGrowthEvidence: boolean;
}

const EMPTY_CATEGORY_COUNTS: Readonly<Record<GrowthEventCategory, number>> = {
  discipline: 0,
  patience: 0,
  risk_awareness: 0,
  emotional_regulation: 0,
  process_improvement: 0,
};

const EMPTY_EVIDENCE_SOURCE_COUNTS: Readonly<Record<AcademyGrowthEventEvidence['sourceType'], number>> = {
  journal_growth_event: 0,
  mission_debrief: 0,
};

export function buildAcademyStatistics(events: readonly AcademyGrowthEvent[]): AcademyStatistics {
  const xpSummary = calculateAcademyXp(events);

  return {
    totalGrowthEvents: events.length,
    totalXp: xpSummary.totalXp,
    level: resolveAcademyLevel(xpSummary.totalXp),
    recognitionCount: buildAcademyRecognitions(events).length,
    categoryCounts: countByCategory(events),
    evidenceSourceCounts: countByEvidenceSource(events),
    hasGrowthEvidence: events.length > 0,
  };
}

function countByCategory(
  events: readonly AcademyGrowthEvent[],
): Readonly<Record<GrowthEventCategory, number>> {
  const counts: Record<GrowthEventCategory, number> = { ...EMPTY_CATEGORY_COUNTS };

  for (const event of events) {
    counts[event.category] += 1;
  }

  return counts;
}

function countByEvidenceSource(
  events: readonly AcademyGrowthEvent[],
): Readonly<Record<AcademyGrowthEventEvidence['sourceType'], number>> {
  const counts: Record<AcademyGrowthEventEvidence['sourceType'], number> = { ...EMPTY_EVIDENCE_SOURCE_COUNTS };

  for (const event of events) {
    counts[event.evidence.sourceType] += 1;
  }

  return counts;
}
