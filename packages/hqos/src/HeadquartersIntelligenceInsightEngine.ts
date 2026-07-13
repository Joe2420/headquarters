import type { CrossMissionPattern } from './CrossMissionPatternEngine';
import type { IntelligenceEvidenceReference } from './HeadquartersIntelligenceGraph';
import { stableIntelligenceId } from './HeadquartersIntelligenceGraph';
import type { IntelligenceTrendAnalysis } from './IntelligenceTrendEngine';

export type HeadquartersIntelligenceInsightCategory =
  | 'current_mission_relevance'
  | 'repeated_behavior'
  | 'improvement'
  | 'regression'
  | 'recurring_risk'
  | 'recurring_guardian_intervention'
  | 'doctrine_support'
  | 'doctrine_conflict'
  | 'similar_historical_mission'
  | 'recovery_progress'
  | 'journal_theme'
  | 'academy_training_focus'
  | 'archive_pattern'
  | 'mission_preparation_pattern'
  | 'observation_pattern'
  | 'authorization_pattern'
  | 'debrief_pattern';

export type HeadquartersIntelligenceInsightUrgency = 'immediate' | 'safe_point' | 'standby' | 'background';
export type HeadquartersIntelligenceInsightStrength = 'weak' | 'emerging' | 'supported' | 'repeated' | 'established';
export type HeadquartersIntelligenceInsightStatus = 'active' | 'reviewed' | 'resolved' | 'superseded' | 'background';

export interface HeadquartersIntelligenceInsight {
  readonly insightId: string;
  readonly category: HeadquartersIntelligenceInsightCategory;
  readonly title: string;
  readonly conciseSummary: string;
  readonly explanation: string;
  readonly relevance: string;
  readonly urgency: HeadquartersIntelligenceInsightUrgency;
  readonly strength: HeadquartersIntelligenceInsightStrength;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
  readonly supportingMissions: readonly string[];
  readonly contradictoryMissions: readonly string[];
  readonly relatedDoctrine: readonly string[];
  readonly relatedGuardianRules: readonly string[];
  readonly relatedJournalEntries: readonly string[];
  readonly recommendedRoom: 'command' | 'ready-room' | 'observation' | 'war-room' | 'debrief' | 'archive' | 'guardian' | 'doctrine' | 'journal' | 'academy' | 'intelligence';
  readonly recommendedAction: string;
  readonly createdAt: string;
  readonly status: HeadquartersIntelligenceInsightStatus;
  readonly validUntil?: string | undefined;
}

export interface HeadquartersIntelligenceInsightEngineInput {
  readonly patterns?: readonly CrossMissionPattern[] | undefined;
  readonly trends?: readonly IntelligenceTrendAnalysis[] | undefined;
  readonly createdAt: string;
}

export function deriveHeadquartersIntelligenceInsights(
  input: HeadquartersIntelligenceInsightEngineInput,
): readonly HeadquartersIntelligenceInsight[] {
  const insights = [
    ...(input.patterns ?? []).map((pattern) => insightFromPattern(pattern, input.createdAt)),
    ...(input.trends ?? []).map((trend) => insightFromTrend(trend, input.createdAt)),
  ].filter((insight): insight is HeadquartersIntelligenceInsight => insight !== undefined);

  return Object.freeze([...new Map(insights.map((insight) => [insight.insightId, insight])).values()]
    .sort((left, right) => left.insightId.localeCompare(right.insightId)));
}

function insightFromPattern(
  pattern: CrossMissionPattern,
  createdAt: string,
): HeadquartersIntelligenceInsight | undefined {
  if (pattern.status === 'blocked_by_contradiction') return undefined;
  const category = categoryFromPattern(pattern.category);
  const urgency = urgencyFromPattern(pattern.category, pattern.status);
  const evidenceReferences = [...pattern.supportingEvidence, ...pattern.contradictoryEvidence];
  if (evidenceReferences.length === 0) return undefined;

  return freezeInsight({
    insightId: stableIntelligenceId('insight', [pattern.patternId, pattern.status]),
    category,
    title: pattern.title,
    conciseSummary: `${pattern.title} is supported by ${pattern.occurrenceCount} mission${pattern.occurrenceCount === 1 ? '' : 's'}.`,
    explanation: pattern.explanation,
    relevance: pattern.relevanceConditions.join(', '),
    urgency,
    strength: pattern.strength,
    evidenceReferences,
    supportingMissions: pattern.evidenceMissionIds,
    contradictoryMissions: getMissionIdsFromSourceEntities(pattern.contradictoryEvidence.map((evidence) => evidence.sourceEntityId)),
    relatedDoctrine: [],
    relatedGuardianRules: category === 'recurring_guardian_intervention' || category === 'recurring_risk' ? pattern.evidenceNodeIds : [],
    relatedJournalEntries: category === 'journal_theme' ? pattern.evidenceNodeIds : [],
    recommendedRoom: roomFromInsightCategory(category),
    recommendedAction: actionFromInsightCategory(category),
    createdAt,
    status: pattern.status === 'historical' || pattern.status === 'resolved' ? 'resolved' : urgency === 'background' ? 'background' : 'active',
  });
}

function insightFromTrend(
  trend: IntelligenceTrendAnalysis,
  createdAt: string,
): HeadquartersIntelligenceInsight | undefined {
  if (trend.trend === 'insufficient_history') return undefined;
  const category = trend.trend === 'improving' || trend.trend === 'recovered'
    ? 'improvement'
    : trend.trend === 'declining'
      ? 'regression'
      : 'archive_pattern';
  const evidenceReferences = [...trend.supportingObservations, ...trend.contradictoryObservations];
  if (evidenceReferences.length === 0) return undefined;

  return freezeInsight({
    insightId: stableIntelligenceId('insight', [trend.trendId]),
    category,
    title: `${trend.subject}: ${trend.trend}`,
    conciseSummary: trend.explanation,
    explanation: `${trend.explanation} Sample size: ${trend.sampleSize}.`,
    relevance: `${trend.subject} can inform Commander pacing without replacing current mission evidence.`,
    urgency: trend.trend === 'declining' ? 'safe_point' : 'standby',
    strength: trend.sampleSize >= 8 ? 'established' : trend.sampleSize >= 5 ? 'repeated' : 'supported',
    evidenceReferences,
    supportingMissions: missionIdsFromEvidence(trend.supportingObservations),
    contradictoryMissions: missionIdsFromEvidence(trend.contradictoryObservations),
    relatedDoctrine: [],
    relatedGuardianRules: [],
    relatedJournalEntries: [],
    recommendedRoom: category === 'regression' ? 'intelligence' : 'academy',
    recommendedAction: category === 'regression' ? 'Review trend evidence' : 'Acknowledge improvement carefully',
    createdAt,
    status: 'active',
  });
}

function categoryFromPattern(category: CrossMissionPattern['category']): HeadquartersIntelligenceInsightCategory {
  if (category.includes('guardian')) return 'recurring_guardian_intervention';
  if (category.includes('risk')) return 'recurring_risk';
  if (category.includes('authorization')) return 'authorization_pattern';
  if (category.includes('observation')) return 'observation_pattern';
  if (category.includes('debrief')) return 'debrief_pattern';
  if (category.includes('doctrine')) return 'doctrine_support';
  if (category.includes('market')) return 'archive_pattern';
  if (category.includes('improvement')) return 'improvement';
  if (category.includes('regression')) return 'regression';
  return 'repeated_behavior';
}

function urgencyFromPattern(
  category: CrossMissionPattern['category'],
  status: CrossMissionPattern['status'],
): HeadquartersIntelligenceInsightUrgency {
  if (status === 'resolved' || status === 'historical') return 'background';
  if (category === 'repeated_risk_violation' || category === 'repeated_guardian_alert') return 'immediate';
  if (category.includes('authorization') || category.includes('process_failure')) return 'safe_point';
  if (category.includes('improvement')) return 'standby';
  return 'background';
}

function roomFromInsightCategory(category: HeadquartersIntelligenceInsightCategory): HeadquartersIntelligenceInsight['recommendedRoom'] {
  if (category === 'recurring_risk' || category === 'recurring_guardian_intervention') return 'guardian';
  if (category === 'authorization_pattern') return 'war-room';
  if (category === 'observation_pattern') return 'observation';
  if (category === 'debrief_pattern') return 'debrief';
  if (category === 'doctrine_support' || category === 'doctrine_conflict') return 'doctrine';
  if (category === 'journal_theme') return 'journal';
  return 'intelligence';
}

function actionFromInsightCategory(category: HeadquartersIntelligenceInsightCategory): string {
  if (category === 'authorization_pattern') return 'Review authorization evidence before requesting approval.';
  if (category === 'recurring_risk') return 'Review the supporting Guardian and risk evidence.';
  if (category === 'observation_pattern') return 'Emphasize evidence completion during Observation.';
  if (category === 'improvement') return 'Acknowledge the improvement without exaggeration.';
  if (category === 'regression') return 'Review the contradictory and recent evidence.';
  return 'Review supporting and contradictory evidence.';
}

function missionIdsFromEvidence(evidence: readonly IntelligenceEvidenceReference[]): readonly string[] {
  return getMissionIdsFromSourceEntities(evidence.map((item) => item.sourceEntityId));
}

function getMissionIdsFromSourceEntities(sourceEntityIds: readonly string[]): readonly string[] {
  const missionIds: string[] = [];
  for (const sourceEntityId of sourceEntityIds) {
    const [missionId] = sourceEntityId.split(':');
    if (missionId) missionIds.push(missionId);
  }
  return Object.freeze([...new Set(missionIds)].sort());
}

function freezeInsight(input: HeadquartersIntelligenceInsight): HeadquartersIntelligenceInsight {
  if (/\bbuy\b|\bsell\b|market will|predict/i.test(`${input.title} ${input.conciseSummary} ${input.explanation} ${input.recommendedAction}`)) {
    throw new Error('Intelligence insight cannot contain market prediction language.');
  }
  return Object.freeze({
    ...input,
    evidenceReferences: Object.freeze([...input.evidenceReferences]),
    supportingMissions: Object.freeze([...input.supportingMissions]),
    contradictoryMissions: Object.freeze([...input.contradictoryMissions]),
    relatedDoctrine: Object.freeze([...input.relatedDoctrine]),
    relatedGuardianRules: Object.freeze([...input.relatedGuardianRules]),
    relatedJournalEntries: Object.freeze([...input.relatedJournalEntries]),
  });
}
