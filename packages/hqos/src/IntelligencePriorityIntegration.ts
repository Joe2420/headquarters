import type { HeadquartersIntelligenceInsight } from './HeadquartersIntelligenceInsightEngine';
import type { HeadquartersPriorityItem } from './HeadquartersPriorityEngine';

export type IntelligencePriorityInterruptionPolicy = 'immediate' | 'safe_point' | 'standby' | 'background_only';

export interface IntelligencePriorityRequest {
  readonly requestId: string;
  readonly insightId: string;
  readonly policy: IntelligencePriorityInterruptionPolicy;
  readonly title: string;
  readonly explanation: string;
  readonly commanderOnly: true;
  readonly resolved: boolean;
}

export function buildIntelligencePriorityRequests(
  insights: readonly HeadquartersIntelligenceInsight[],
): readonly IntelligencePriorityRequest[] {
  const requests = insights
    .filter((insight) => insight.status !== 'background')
    .map((insight) => requestFromInsight(insight))
    .filter((request): request is IntelligencePriorityRequest => request !== undefined);
  return Object.freeze([...new Map(requests.map((request) => [request.requestId, request])).values()]
    .sort((left, right) => left.requestId.localeCompare(right.requestId)));
}

export function buildIntelligencePriorityItems(
  insights: readonly HeadquartersIntelligenceInsight[],
  detectedAt: string,
): readonly HeadquartersPriorityItem[] {
  return Object.freeze(buildIntelligencePriorityRequests(insights)
    .filter((request) => request.policy !== 'background_only')
    .map((request) => ({
      id: `priority:intelligence:${request.insightId}`,
      source: 'intelligence',
      type: 'intelligence_insight',
      title: request.title,
      explanation: `${request.explanation} Commander must decide when to surface it.`,
      severity: request.policy === 'immediate' ? 'immediate' : request.policy === 'safe_point' ? 'pending' : 'informational',
      urgency: request.policy === 'immediate' ? 'now' : request.policy === 'safe_point' ? 'soon' : 'later',
      lifecycleRelevance: request.policy === 'immediate' ? 'current' : request.policy === 'safe_point' ? 'related' : 'standby',
      blocking: false,
      recommendedRoom: 'command-center',
      recommendedAction: request.policy === 'immediate' ? 'Review Intelligence contradiction' : 'Review Intelligence evidence',
      evidenceReferences: [{ id: request.insightId, source: 'intelligence' }],
      detectedAt,
      resolved: request.resolved,
    } satisfies HeadquartersPriorityItem)));
}

function requestFromInsight(
  insight: HeadquartersIntelligenceInsight,
): IntelligencePriorityRequest | undefined {
  if (insight.status === 'resolved' || insight.status === 'superseded') {
    return freezeRequest(insight, 'background_only', true);
  }
  if (insight.strength === 'weak') return undefined;
  if (insight.category === 'recurring_risk' && insight.urgency === 'immediate') {
    return freezeRequest(insight, 'immediate', false);
  }
  if (insight.category === 'doctrine_conflict' || insight.category === 'regression') {
    return freezeRequest(insight, 'safe_point', false);
  }
  if (insight.category === 'improvement' || insight.category === 'academy_training_focus') {
    return freezeRequest(insight, 'standby', false);
  }
  if (insight.urgency === 'background') return freezeRequest(insight, 'background_only', false);
  return freezeRequest(insight, insight.urgency === 'immediate' ? 'immediate' : 'safe_point', false);
}

function freezeRequest(
  insight: HeadquartersIntelligenceInsight,
  policy: IntelligencePriorityInterruptionPolicy,
  resolved: boolean,
): IntelligencePriorityRequest {
  return Object.freeze({
    requestId: `intelligence-request:${insight.insightId}`,
    insightId: insight.insightId,
    policy,
    title: insight.title,
    explanation: insight.conciseSummary,
    commanderOnly: true,
    resolved,
  });
}
