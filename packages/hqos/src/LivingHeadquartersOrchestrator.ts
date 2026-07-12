import type { CommanderRelationship } from './CommanderRelationship';
import type { HeadquartersPriorityItem } from './HeadquartersPriorityEngine';
import type { InstitutionalHealthSnapshot } from './InstitutionalHealth';
import type { MissionLifecycleProjection, MissionLifecycleRoom } from './MissionLifecycleProjection';
import type { OperationalConsequence } from './OperationalConsequence';
import {
  canAttentionRequestInterrupt,
  getAttentionRequestReturnContext,
  isAttentionRequestActionable,
  type HeadquartersAttentionRequest,
  type HeadquartersAttentionReturnContext,
} from './HeadquartersAttentionRequest';

export type LivingHeadquartersCommanderIntent =
  | 'standby'
  | 'surfaceAttentionRequest'
  | 'queueAttentionRequest'
  | 'interruptForCriticalRequest'
  | 'returnToOperation'
  | 'continueMissionLifecycle';

export interface LivingHeadquartersConversationState {
  readonly activeQuestionPending: boolean;
  readonly activeCommanderQuestionId?: string | undefined;
  readonly conversationIntent?: string | undefined;
  readonly inputSubmitting?: boolean | undefined;
}

export interface LivingHeadquartersTransitionState {
  readonly running: boolean;
  readonly destinationRoom?: MissionLifecycleRoom | undefined;
}

export interface LivingHeadquartersRuntimeState {
  readonly currentRoom: MissionLifecycleRoom;
  readonly selectedView: 'commander-chat' | 'current-room' | 'request-center' | string;
  readonly transition: LivingHeadquartersTransitionState;
  readonly authorizationDecisionInProgress?: boolean | undefined;
  readonly archiveTransactionInProgress?: boolean | undefined;
}

export interface LivingHeadquartersOrchestratorInput {
  readonly lifecycle: MissionLifecycleProjection;
  readonly priorities: readonly HeadquartersPriorityItem[];
  readonly pendingRequests: readonly HeadquartersAttentionRequest[];
  readonly conversation: LivingHeadquartersConversationState;
  readonly runtime: LivingHeadquartersRuntimeState;
  readonly institutionalHealth?: InstitutionalHealthSnapshot | undefined;
  readonly commanderRelationship?: CommanderRelationship | undefined;
  readonly activeConsequences?: readonly OperationalConsequence[] | undefined;
  readonly surfacedRequestIds?: readonly string[] | undefined;
  readonly evaluatedAt: string;
}

export interface LivingHeadquartersReturnPlan {
  readonly returnRoom: MissionLifecycleRoom;
  readonly returnView: string;
  readonly resumeQuestionId?: string | undefined;
  readonly resumeIntent?: string | undefined;
  readonly reason: string;
}

export interface LivingHeadquartersDecision {
  readonly highestEligibleRequest?: HeadquartersAttentionRequest | undefined;
  readonly requestsQueued: readonly HeadquartersAttentionRequest[];
  readonly requestToSurface?: HeadquartersAttentionRequest | undefined;
  readonly interruptionAllowed: boolean;
  readonly interruptionReason: string;
  readonly CommanderIntent: LivingHeadquartersCommanderIntent;
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly recommendedAction: string;
  readonly preservedContext: HeadquartersAttentionReturnContext;
  readonly returnPlan?: LivingHeadquartersReturnPlan | undefined;
  readonly nextEvaluationAt?: string | undefined;
  readonly noOpReason?: string | undefined;
}

const urgencyRank = {
  critical: 0,
  immediate: 1,
  soon: 2,
  routine: 3,
  background: 4,
} as const;

const severityRank = {
  critical: 0,
  blocking: 1,
  warning: 2,
  notice: 3,
  background: 4,
} as const;

export function orchestrateLivingHeadquarters(
  input: LivingHeadquartersOrchestratorInput,
): LivingHeadquartersDecision {
  const actionableRequests = dedupeRequests(input.pendingRequests)
    .filter(isAttentionRequestActionable)
    .filter((request) => !(input.surfacedRequestIds ?? []).includes(request.requestId))
    .sort(compareRequests);

  const preservedContext = buildPreservedContext(input);
  const highestEligibleRequest = actionableRequests[0];

  if (highestEligibleRequest === undefined) {
    return {
      requestsQueued: [],
      interruptionAllowed: false,
      interruptionReason: 'No actionable Headquarters attention request exists.',
      CommanderIntent: 'standby',
      recommendedRoom: input.lifecycle.recommendedRoom,
      recommendedAction: input.lifecycle.currentPrimaryAction.label,
      preservedContext,
      noOpReason: 'no_actionable_request',
    };
  }

  const safety = getInterruptionSafety(input, highestEligibleRequest);
  const mayInterrupt = safety.allowed && canAttentionRequestInterrupt(highestEligibleRequest);
  const criticalOverride = isCriticalOverride(highestEligibleRequest);
  const shouldSurface = mayInterrupt || criticalOverride;
  const requestToSurface = shouldSurface ? highestEligibleRequest : undefined;
  const queued = actionableRequests.filter((request) => request.requestId !== requestToSurface?.requestId);
  const returnPlan = requestToSurface
    ? buildReturnPlan(requestToSurface, preservedContext)
    : undefined;

  return {
    highestEligibleRequest,
    requestsQueued: Object.freeze(queued),
    ...(requestToSurface ? { requestToSurface } : {}),
    interruptionAllowed: shouldSurface,
    interruptionReason: criticalOverride && !safety.allowed
      ? `Critical override allowed: ${highestEligibleRequest.reason}`
      : safety.reason,
    CommanderIntent: getCommanderIntent({
      request: highestEligibleRequest,
      surfaced: shouldSurface,
      lifecycle: input.lifecycle,
    }),
    recommendedRoom: requestToSurface?.recommendedRoom ?? input.lifecycle.recommendedRoom,
    recommendedAction: requestToSurface?.recommendedAction ?? input.lifecycle.currentPrimaryAction.label,
    preservedContext,
    ...(returnPlan ? { returnPlan } : {}),
    nextEvaluationAt: shouldSurface ? input.evaluatedAt : addMinutes(input.evaluatedAt, 5),
    ...(shouldSurface ? {} : { noOpReason: safety.reason }),
  };
}

export function buildPreservedContext(
  input: Pick<LivingHeadquartersOrchestratorInput, 'lifecycle' | 'conversation' | 'runtime' | 'priorities'>,
): HeadquartersAttentionReturnContext {
  return Object.freeze({
    previousRoom: input.runtime.currentRoom,
    previousSelectedView: input.runtime.selectedView,
    ...(input.lifecycle.missionId ? { activeMissionId: input.lifecycle.missionId } : {}),
    lifecycleStage: input.lifecycle.activeStage,
    ...(input.conversation.activeCommanderQuestionId
      ? { activeCommanderQuestionId: input.conversation.activeCommanderQuestionId }
      : {}),
    ...(input.conversation.conversationIntent ? { conversationIntent: input.conversation.conversationIntent } : {}),
    transitionState: input.runtime.transition.running ? 'running' : 'idle',
    ...(input.priorities[0]?.id ? { originatingPriorityId: input.priorities[0].id } : {}),
  });
}

function getInterruptionSafety(
  input: LivingHeadquartersOrchestratorInput,
  request: HeadquartersAttentionRequest,
): { readonly allowed: boolean; readonly reason: string } {
  if (input.conversation.activeQuestionPending) {
    return { allowed: false, reason: 'A Commander question is awaiting an answer.' };
  }
  if (input.conversation.inputSubmitting === true) {
    return { allowed: false, reason: 'Operator input is currently being submitted.' };
  }
  if (input.runtime.transition.running) {
    return { allowed: false, reason: 'A room transition is already running.' };
  }
  if (input.runtime.authorizationDecisionInProgress === true) {
    return { allowed: false, reason: 'Authorization decision is in progress.' };
  }
  if (input.runtime.archiveTransactionInProgress === true) {
    return { allowed: false, reason: 'Archive transaction is in progress.' };
  }
  if (request.interruptionPolicy === 'queue_until_mission_complete' && input.lifecycle.missionActive) {
    return { allowed: false, reason: 'Request is queued until the active mission is complete.' };
  }
  if (request.interruptionPolicy === 'background_only') {
    return { allowed: false, reason: 'Background requests do not interrupt.' };
  }
  if (request.interruptionPolicy === 'mention_in_next_brief') {
    return { allowed: false, reason: 'Request will be mentioned in the next Commander brief.' };
  }

  return { allowed: true, reason: 'Headquarters is at a safe interruption point.' };
}

function isCriticalOverride(request: HeadquartersAttentionRequest): boolean {
  return request.urgency === 'critical'
    && request.blocking
    && (
      request.requestType === 'guardian_lockout_active'
      || request.requestType === 'persistence_recovery_required'
      || request.requestType === 'mission_recovery_required'
    );
}

function buildReturnPlan(
  request: HeadquartersAttentionRequest,
  preservedContext: HeadquartersAttentionReturnContext,
): LivingHeadquartersReturnPlan {
  const explicitContext = getAttentionRequestReturnContext(request) ?? preservedContext;
  return Object.freeze({
    returnRoom: explicitContext.previousRoom,
    returnView: explicitContext.previousSelectedView,
    ...(explicitContext.activeCommanderQuestionId ? { resumeQuestionId: explicitContext.activeCommanderQuestionId } : {}),
    ...(explicitContext.conversationIntent ? { resumeIntent: explicitContext.conversationIntent } : {}),
    reason: `Return after ${request.title}.`,
  });
}

function getCommanderIntent(input: {
  readonly request: HeadquartersAttentionRequest;
  readonly surfaced: boolean;
  readonly lifecycle: MissionLifecycleProjection;
}): LivingHeadquartersCommanderIntent {
  if (input.surfaced && input.request.urgency === 'critical') return 'interruptForCriticalRequest';
  if (input.surfaced) return 'surfaceAttentionRequest';
  if (input.request.interruptionPolicy === 'queue_until_mission_complete') return 'queueAttentionRequest';
  if (input.lifecycle.missionActive) return 'continueMissionLifecycle';
  return 'standby';
}

function dedupeRequests(requests: readonly HeadquartersAttentionRequest[]): HeadquartersAttentionRequest[] {
  const byKey = new Map<string, HeadquartersAttentionRequest>();
  for (const request of requests) {
    const existing = byKey.get(request.deduplicationKey);
    if (existing === undefined || compareRequests(request, existing) < 0) {
      byKey.set(request.deduplicationKey, request);
    }
  }
  return [...byKey.values()];
}

function compareRequests(left: HeadquartersAttentionRequest, right: HeadquartersAttentionRequest): number {
  return urgencyRank[left.urgency] - urgencyRank[right.urgency]
    || severityRank[left.severity] - severityRank[right.severity]
    || Number(right.blocking) - Number(left.blocking)
    || left.firstEligibleAt.localeCompare(right.firstEligibleAt)
    || left.sourceSubsystem.localeCompare(right.sourceSubsystem)
    || left.requestId.localeCompare(right.requestId);
}

function addMinutes(isoDateTime: string, minutes: number): string {
  const timestamp = Date.parse(isoDateTime);
  if (Number.isNaN(timestamp)) return isoDateTime;
  return new Date(timestamp + minutes * 60_000).toISOString();
}
