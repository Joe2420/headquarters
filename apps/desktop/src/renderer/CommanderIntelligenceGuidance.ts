import type {
  HeadquartersIntelligenceInsight,
  RelevantHistoricalMission,
} from '@headquarters/hqos';
import type { CommanderShellRoomId } from './CommanderShell';

export type CommanderIntelligenceIntent =
  | 'summarizeRelevantPattern'
  | 'referenceSimilarMission'
  | 'acknowledgeImprovement'
  | 'challengeRecurringIssue'
  | 'citeDoctrineSupport'
  | 'citeGuardianHistory'
  | 'requestIntelligenceReview'
  | 'deferBackgroundInsight'
  | 'explainContradictoryHistory';

export interface CommanderIntelligenceGuidanceInput {
  readonly room: CommanderShellRoomId;
  readonly insight?: HeadquartersIntelligenceInsight | undefined;
  readonly similarMission?: RelevantHistoricalMission | undefined;
  readonly alreadyReferencedInsightIds?: readonly string[] | undefined;
}

export interface CommanderIntelligenceGuidance {
  readonly intent: CommanderIntelligenceIntent;
  readonly text: string;
  readonly evidenceIds: readonly string[];
  readonly insightId?: string | undefined;
  readonly room: CommanderShellRoomId;
}

export function buildCommanderIntelligenceGuidance(
  input: CommanderIntelligenceGuidanceInput,
): CommanderIntelligenceGuidance | undefined {
  if (input.insight && input.alreadyReferencedInsightIds?.includes(input.insight.insightId)) return undefined;
  if (input.similarMission) return guidanceForSimilarMission(input.room, input.similarMission, input.insight?.insightId);
  if (!input.insight) return undefined;
  if (input.insight.urgency === 'background') return guidanceForInsight(input.room, input.insight, 'deferBackgroundInsight');
  if (input.insight.contradictoryMissions.length > 0) {
    return guidanceForInsight(input.room, input.insight, 'explainContradictoryHistory');
  }
  if (input.insight.category === 'improvement') return guidanceForInsight(input.room, input.insight, 'acknowledgeImprovement');
  if (input.insight.category === 'recurring_guardian_intervention' || input.insight.category === 'recurring_risk') {
    return guidanceForInsight(input.room, input.insight, 'citeGuardianHistory');
  }
  if (input.insight.category === 'doctrine_support') return guidanceForInsight(input.room, input.insight, 'citeDoctrineSupport');
  if (input.insight.category === 'authorization_pattern' || input.insight.category === 'observation_pattern') {
    return guidanceForInsight(input.room, input.insight, 'challengeRecurringIssue');
  }
  return guidanceForInsight(input.room, input.insight, 'summarizeRelevantPattern');
}

function guidanceForInsight(
  room: CommanderShellRoomId,
  insight: HeadquartersIntelligenceInsight,
  intent: CommanderIntelligenceIntent,
): CommanderIntelligenceGuidance {
  const missionReference = formatMissionReference(insight.supportingMissions);
  const contradiction = insight.contradictoryMissions.length > 0
    ? ` Important difference: ${insight.contradictoryMissions.length} contradictory mission${insight.contradictoryMissions.length === 1 ? '' : 's'} remain in the record.`
    : '';
  const text = `${missionReference} support ${insight.title}. ${insight.recommendedAction}${contradiction}`;
  return freezeGuidance({
    intent,
    text,
    evidenceIds: insight.evidenceReferences.map((evidence) => evidence.evidenceId),
    insightId: insight.insightId,
    room,
  });
}

function guidanceForSimilarMission(
  room: CommanderShellRoomId,
  mission: RelevantHistoricalMission,
  insightId?: string | undefined,
): CommanderIntelligenceGuidance {
  const differences = mission.importantDifferences.length > 0
    ? ` Important difference: ${mission.importantDifferences[0]}`
    : ' No outcome is implied for the current mission.';
  return freezeGuidance({
    intent: 'referenceSimilarMission',
    text: `Mission ${mission.missionId} is historically relevant because ${mission.matchedDimensions.join(', ')} match.${differences}`,
    evidenceIds: mission.evidenceReferences.map((evidence) => evidence.evidenceId),
    insightId,
    room,
  });
}

function formatMissionReference(missionIds: readonly string[]): string {
  if (missionIds.length === 0) return 'Persisted Headquarters evidence';
  if (missionIds.length === 1) return `Mission ${missionIds[0]}`;
  return `${missionIds.length} missions`;
}

function freezeGuidance(input: CommanderIntelligenceGuidance): CommanderIntelligenceGuidance {
  if (/\bbuy\b|\bsell\b|market will|predict|always do this/i.test(input.text)) {
    throw new Error('Commander Intelligence guidance cannot include prediction or unsupported label language.');
  }
  return Object.freeze({
    ...input,
    evidenceIds: Object.freeze([...input.evidenceIds]),
  });
}
