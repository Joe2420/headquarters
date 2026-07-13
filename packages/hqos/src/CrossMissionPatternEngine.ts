import type { IntelligenceEvidenceReference, IntelligenceGraphSnapshot } from './HeadquartersIntelligenceGraph';
import { stableIntelligenceId } from './HeadquartersIntelligenceGraph';

export type CrossMissionPatternCategory =
  | 'repeated_strength'
  | 'repeated_process_failure'
  | 'repeated_guardian_alert'
  | 'repeated_recovery'
  | 'repeated_observation_gap'
  | 'repeated_authorization_gap'
  | 'repeated_risk_adherence'
  | 'repeated_risk_violation'
  | 'repeated_debrief_quality'
  | 'repeated_doctrine_usage'
  | 'repeated_doctrine_violation'
  | 'recurring_market_context'
  | 'recurring_commitment'
  | 'sustained_improvement'
  | 'sustained_regression'
  | 'inconsistent_behavior'
  | 'unresolved_recurring_issue';

export type CrossMissionPatternTrend = 'improving' | 'declining' | 'stable' | 'mixed' | 'insufficient_history';
export type CrossMissionPatternStrength = 'emerging' | 'supported' | 'repeated' | 'established';
export type CrossMissionPatternStatus = 'active' | 'historical' | 'resolved' | 'blocked_by_contradiction';

export interface CrossMissionPatternEvidence {
  readonly evidenceId: string;
  readonly missionId: string;
  readonly category: CrossMissionPatternCategory;
  readonly title: string;
  readonly summary: string;
  readonly occurredAt: string;
  readonly nodeId?: string | undefined;
  readonly sourceSubsystem: string;
  readonly polarity: 'supporting' | 'contradictory';
  readonly resolved?: boolean | undefined;
  readonly excludesBehaviorPattern?: boolean | undefined;
}

export interface CrossMissionPattern {
  readonly patternId: string;
  readonly category: CrossMissionPatternCategory;
  readonly title: string;
  readonly explanation: string;
  readonly evidenceMissionIds: readonly string[];
  readonly evidenceNodeIds: readonly string[];
  readonly supportingEvidence: readonly IntelligenceEvidenceReference[];
  readonly contradictoryEvidence: readonly IntelligenceEvidenceReference[];
  readonly occurrenceCount: number;
  readonly firstObservedAt: string;
  readonly lastObservedAt: string;
  readonly trend: CrossMissionPatternTrend;
  readonly strength: CrossMissionPatternStrength;
  readonly status: CrossMissionPatternStatus;
  readonly relevanceConditions: readonly string[];
  readonly recommendedUse: string;
}

export interface CrossMissionPatternEngineInput {
  readonly graph?: IntelligenceGraphSnapshot | undefined;
  readonly evidence: readonly CrossMissionPatternEvidence[];
}

export function detectCrossMissionPatterns(input: CrossMissionPatternEngineInput): readonly CrossMissionPattern[] {
  const supportedEvidence = input.evidence.filter((evidence) => !evidence.excludesBehaviorPattern);
  const byCategory = new Map<CrossMissionPatternCategory, CrossMissionPatternEvidence[]>();
  for (const evidence of supportedEvidence) {
    const entries = byCategory.get(evidence.category) ?? [];
    entries.push(evidence);
    byCategory.set(evidence.category, entries);
  }

  const patterns: CrossMissionPattern[] = [];
  for (const [category, evidence] of byCategory) {
    const supporting = dedupeEvidence(evidence.filter((entry) => entry.polarity === 'supporting'));
    const contradictory = dedupeEvidence(evidence.filter((entry) => entry.polarity === 'contradictory'));
    const distinctMissionIds = [...new Set(supporting.map((entry) => entry.missionId))].sort();
    if (distinctMissionIds.length < 2) continue;

    const strength = getPatternStrength(distinctMissionIds.length, contradictory.length);
    if (!strength) continue;
    const ordered = [...supporting].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    const resolved = supporting.every((entry) => entry.resolved);
    const status = contradictory.length >= supporting.length
      ? 'blocked_by_contradiction'
      : resolved
        ? 'resolved'
        : 'active';

    patterns.push(Object.freeze({
      patternId: stableIntelligenceId('pattern', [category, ...distinctMissionIds]),
      category,
      title: getPatternTitle(category),
      explanation: getPatternExplanation(category, distinctMissionIds.length, contradictory.length),
      evidenceMissionIds: Object.freeze(distinctMissionIds),
      evidenceNodeIds: Object.freeze([...new Set(supporting.map((entry) => entry.nodeId).filter((id): id is string => Boolean(id)))].sort()),
      supportingEvidence: Object.freeze(supporting.map(toEvidenceReference)),
      contradictoryEvidence: Object.freeze(contradictory.map(toEvidenceReference)),
      occurrenceCount: distinctMissionIds.length,
      firstObservedAt: ordered[0]?.occurredAt ?? '',
      lastObservedAt: ordered[ordered.length - 1]?.occurredAt ?? '',
      trend: inferPatternTrend(supporting, contradictory),
      strength,
      status,
      relevanceConditions: Object.freeze(getRelevanceConditions(category)),
      recommendedUse: getRecommendedUse(category),
    }));
  }

  return Object.freeze(patterns.sort((left, right) => left.patternId.localeCompare(right.patternId)));
}

function getPatternStrength(
  distinctMissionCount: number,
  contradictionCount: number,
): CrossMissionPatternStrength | undefined {
  if (distinctMissionCount < 2) return undefined;
  if (contradictionCount >= distinctMissionCount) return undefined;
  if (distinctMissionCount >= 8 && contradictionCount <= 1) return 'established';
  if (distinctMissionCount >= 5) return 'repeated';
  if (distinctMissionCount >= 3) return 'supported';
  return 'emerging';
}

function inferPatternTrend(
  supporting: readonly CrossMissionPatternEvidence[],
  contradictory: readonly CrossMissionPatternEvidence[],
): CrossMissionPatternTrend {
  if (supporting.length < 2) return 'insufficient_history';
  if (supporting.every((entry) => entry.resolved)) return 'improving';
  if (contradictory.length > 0) return 'mixed';
  return 'stable';
}

function dedupeEvidence(evidence: readonly CrossMissionPatternEvidence[]): CrossMissionPatternEvidence[] {
  return [...new Map(evidence.map((entry) => [`${entry.missionId}:${entry.evidenceId}:${entry.polarity}`, entry])).values()];
}

function toEvidenceReference(evidence: CrossMissionPatternEvidence): IntelligenceEvidenceReference {
  return Object.freeze({
    evidenceId: evidence.evidenceId,
    sourceSubsystem: evidence.sourceSubsystem,
    sourceEntityId: evidence.evidenceId,
    description: evidence.summary,
    occurredAt: evidence.occurredAt,
  });
}

function getPatternTitle(category: CrossMissionPatternCategory): string {
  return category.split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function getPatternExplanation(
  category: CrossMissionPatternCategory,
  missionCount: number,
  contradictionCount: number,
): string {
  const contradictionText = contradictionCount > 0
    ? ` ${contradictionCount} contradictory evidence record${contradictionCount === 1 ? '' : 's'} remain visible.`
    : '';
  return `${getPatternTitle(category)} appeared across ${missionCount} distinct missions.${contradictionText}`;
}

function getRelevanceConditions(category: CrossMissionPatternCategory): readonly string[] {
  if (category.includes('authorization')) return Object.freeze(['war-room', 'authorization-review']);
  if (category.includes('observation')) return Object.freeze(['observation', 'evidence-quality']);
  if (category.includes('guardian') || category.includes('risk')) return Object.freeze(['guardian', 'risk-review']);
  if (category.includes('debrief')) return Object.freeze(['debrief', 'review-quality']);
  return Object.freeze(['cross-mission-review']);
}

function getRecommendedUse(category: CrossMissionPatternCategory): string {
  if (category === 'repeated_risk_adherence') return 'Commander may acknowledge disciplined risk adherence without exaggeration.';
  if (category === 'repeated_risk_violation') return 'Guardian and Commander may require risk review before authorization.';
  if (category === 'repeated_authorization_gap') return 'Commander may request stronger War Room evidence.';
  if (category === 'sustained_improvement') return 'Academy may consume the evidence later without duplicate scoring.';
  return 'Use as evidence-backed background Intelligence.';
}
