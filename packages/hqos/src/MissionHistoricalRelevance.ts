import type { IntelligenceEvidenceReference } from './HeadquartersIntelligenceGraph';
import { stableIntelligenceId } from './HeadquartersIntelligenceGraph';
import { normalizeMarketName, normalizeRiskExpression } from './IntelligenceNormalization';

export interface MissionHistoricalContext {
  readonly missionId: string;
  readonly market?: string | undefined;
  readonly environment?: string | undefined;
  readonly session?: string | undefined;
  readonly risk?: string | undefined;
  readonly observedStructure?: string | undefined;
  readonly liquidity?: string | undefined;
  readonly directionalHypothesis?: string | undefined;
  readonly doctrineIds?: readonly string[] | undefined;
  readonly guardianRuleIds?: readonly string[] | undefined;
  readonly behavioralFocus?: readonly string[] | undefined;
}

export interface HistoricalMissionEvidence {
  readonly missionId: string;
  readonly context: MissionHistoricalContext;
  readonly evaluationSummary: string;
  readonly relatedGuardianEvents: readonly string[];
  readonly relatedDoctrine: readonly string[];
  readonly relatedLessons: readonly string[];
  readonly replayId?: string | undefined;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
}

export interface RelevantHistoricalMission {
  readonly relevanceId: string;
  readonly missionId: string;
  readonly relevanceReasons: readonly string[];
  readonly matchedDimensions: readonly string[];
  readonly importantDifferences: readonly string[];
  readonly evaluationSummary: string;
  readonly relatedGuardianEvents: readonly string[];
  readonly relatedDoctrine: readonly string[];
  readonly relatedLessons: readonly string[];
  readonly replayId?: string | undefined;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
  readonly relevanceStrength: 'weak' | 'supported' | 'strong';
}

export interface MissionHistoricalRelevanceInput {
  readonly currentMission: MissionHistoricalContext;
  readonly historicalMissions: readonly HistoricalMissionEvidence[];
}

export function findRelevantHistoricalMissions(
  input: MissionHistoricalRelevanceInput,
): readonly RelevantHistoricalMission[] {
  return Object.freeze(input.historicalMissions
    .filter((mission) => mission.missionId !== input.currentMission.missionId)
    .map((mission) => scoreHistoricalMission(input.currentMission, mission))
    .filter((mission): mission is RelevantHistoricalMission => mission !== undefined)
    .sort(compareRelevantHistoricalMissions));
}

function scoreHistoricalMission(
  current: MissionHistoricalContext,
  historical: HistoricalMissionEvidence,
): RelevantHistoricalMission | undefined {
  const matchedDimensions = getMatchedDimensions(current, historical.context);
  if (matchedDimensions.length < 2) return undefined;
  if (matchedDimensions.length === 1 && matchedDimensions[0] === 'market') return undefined;

  const importantDifferences = getImportantDifferences(current, historical.context);
  const strength = matchedDimensions.length >= 4 ? 'strong' : matchedDimensions.length >= 2 ? 'supported' : 'weak';
  const relevanceReasons = matchedDimensions.map((dimension) => `Shared ${dimension} context.`);

  return Object.freeze({
    relevanceId: stableIntelligenceId('historical-relevance', [current.missionId, historical.missionId, ...matchedDimensions]),
    missionId: historical.missionId,
    relevanceReasons: Object.freeze(relevanceReasons),
    matchedDimensions: Object.freeze(matchedDimensions),
    importantDifferences: Object.freeze(importantDifferences),
    evaluationSummary: historical.evaluationSummary,
    relatedGuardianEvents: Object.freeze([...historical.relatedGuardianEvents]),
    relatedDoctrine: Object.freeze([...historical.relatedDoctrine]),
    relatedLessons: Object.freeze([...historical.relatedLessons]),
    ...(historical.replayId ? { replayId: historical.replayId } : {}),
    evidenceReferences: Object.freeze([...historical.evidenceReferences]),
    relevanceStrength: strength,
  });
}

function getMatchedDimensions(
  current: MissionHistoricalContext,
  historical: MissionHistoricalContext,
): string[] {
  const matches: string[] = [];
  if (current.market && historical.market && normalizeMarketName(current.market) === normalizeMarketName(historical.market)) {
    matches.push('market');
  }
  if (same(current.environment, historical.environment)) matches.push('environment');
  if (same(current.session, historical.session)) matches.push('session');
  if (current.risk && historical.risk && normalizeRiskExpression(current.risk) === normalizeRiskExpression(historical.risk)) {
    matches.push('risk');
  }
  if (same(current.observedStructure, historical.observedStructure)) matches.push('observed structure');
  if (same(current.liquidity, historical.liquidity)) matches.push('liquidity');
  if (same(current.directionalHypothesis, historical.directionalHypothesis)) matches.push('directional hypothesis');
  if (intersects(current.doctrineIds, historical.doctrineIds)) matches.push('doctrine');
  if (intersects(current.guardianRuleIds, historical.guardianRuleIds)) matches.push('guardian rule');
  if (intersects(current.behavioralFocus, historical.behavioralFocus)) matches.push('behavioral focus');
  return matches;
}

function getImportantDifferences(
  current: MissionHistoricalContext,
  historical: MissionHistoricalContext,
): string[] {
  const differences: string[] = [];
  if (current.guardianRuleIds?.length !== historical.guardianRuleIds?.length) {
    differences.push('Guardian state differs from the historical mission.');
  }
  if (current.risk && historical.risk && normalizeRiskExpression(current.risk) !== normalizeRiskExpression(historical.risk)) {
    differences.push('Risk boundary differs.');
  }
  if (current.session && historical.session && current.session !== historical.session) {
    differences.push('Session differs.');
  }
  return differences;
}

function compareRelevantHistoricalMissions(
  left: RelevantHistoricalMission,
  right: RelevantHistoricalMission,
): number {
  const strengthRank = { strong: 0, supported: 1, weak: 2 } as const;
  return strengthRank[left.relevanceStrength] - strengthRank[right.relevanceStrength]
    || right.matchedDimensions.length - left.matchedDimensions.length
    || left.missionId.localeCompare(right.missionId);
}

function same(left: string | undefined, right: string | undefined): boolean {
  return Boolean(left && right && left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase());
}

function intersects(left: readonly string[] | undefined, right: readonly string[] | undefined): boolean {
  if (!left || !right) return false;
  const values = new Set(left);
  return right.some((value) => values.has(value));
}
