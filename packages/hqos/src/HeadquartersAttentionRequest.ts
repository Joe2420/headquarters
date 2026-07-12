import type { MissionLifecycleRoom, MissionLifecycleStage } from './MissionLifecycleProjection';

export type HeadquartersAttentionSourceSubsystem =
  | 'commander'
  | 'mission'
  | 'guardian'
  | 'doctrine'
  | 'journal'
  | 'academy'
  | 'intelligence'
  | 'archive'
  | 'institutional-health'
  | 'operational-consequences'
  | 'system';

export type HeadquartersAttentionRequestType =
  | 'guardian_attention_required'
  | 'guardian_lockout_active'
  | 'doctrine_candidate_ready'
  | 'doctrine_revision_required'
  | 'doctrine_conflict_detected'
  | 'journal_follow_up_required'
  | 'journal_reflection_available'
  | 'academy_milestone_ready'
  | 'academy_training_recommended'
  | 'intelligence_contradiction_detected'
  | 'intelligence_missing_evidence'
  | 'archive_review_available'
  | 'mission_recovery_required'
  | 'consequence_recovery_required'
  | 'institutional_health_degraded'
  | 'weekly_review_available'
  | 'monthly_review_available'
  | 'persistence_recovery_required';

export type HeadquartersAttentionUrgency = 'critical' | 'immediate' | 'soon' | 'routine' | 'background';
export type HeadquartersAttentionSeverity = 'critical' | 'blocking' | 'warning' | 'notice' | 'background';
export type HeadquartersAttentionStatus =
  | 'pending'
  | 'queued'
  | 'surfaced'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'dismissed'
  | 'expired'
  | 'superseded';

export type HeadquartersInterruptionPolicy =
  | 'interrupt_immediately'
  | 'interrupt_at_safe_point'
  | 'mention_in_next_brief'
  | 'queue_until_mission_complete'
  | 'background_only';

export interface HeadquartersAttentionEvidenceReference {
  readonly id: string;
  readonly source: HeadquartersAttentionSourceSubsystem | string;
  readonly description?: string | undefined;
}

export interface HeadquartersAttentionReturnContext {
  readonly previousRoom: MissionLifecycleRoom;
  readonly previousSelectedView: 'commander-chat' | 'current-room' | 'request-center' | string;
  readonly activeMissionId?: string | undefined;
  readonly lifecycleStage?: MissionLifecycleStage | undefined;
  readonly activeCommanderQuestionId?: string | undefined;
  readonly conversationIntent?: string | undefined;
  readonly scrollSection?: string | undefined;
  readonly transitionState?: 'idle' | 'running' | 'recovering' | string | undefined;
  readonly originatingPriorityId?: string | undefined;
}

export interface HeadquartersAttentionRequest {
  readonly requestId: string;
  readonly sourceSubsystem: HeadquartersAttentionSourceSubsystem;
  readonly requestType: HeadquartersAttentionRequestType;
  readonly title: string;
  readonly summary: string;
  readonly reason: string;
  readonly urgency: HeadquartersAttentionUrgency;
  readonly severity: HeadquartersAttentionSeverity;
  readonly status: HeadquartersAttentionStatus;
  readonly missionId?: string | undefined;
  readonly lifecycleStage?: MissionLifecycleStage | undefined;
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly recommendedAction: string;
  readonly blocking: boolean;
  readonly interruptionPolicy: HeadquartersInterruptionPolicy;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly sourceEntityId: string;
  readonly createdAt: string;
  readonly firstEligibleAt: string;
  readonly expiresAt?: string | undefined;
  readonly acknowledgedAt?: string | undefined;
  readonly resolvedAt?: string | undefined;
  readonly resolutionAction?: string | undefined;
  readonly returnContext?: HeadquartersAttentionReturnContext | undefined;
  readonly deduplicationKey: string;
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
}

export interface HeadquartersAttentionRequestInput {
  readonly requestId: string;
  readonly sourceSubsystem: HeadquartersAttentionSourceSubsystem;
  readonly requestType: HeadquartersAttentionRequestType;
  readonly title: string;
  readonly summary: string;
  readonly reason: string;
  readonly urgency: HeadquartersAttentionUrgency;
  readonly severity: HeadquartersAttentionSeverity;
  readonly status?: HeadquartersAttentionStatus | undefined;
  readonly missionId?: string | undefined;
  readonly lifecycleStage?: MissionLifecycleStage | undefined;
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly recommendedAction: string;
  readonly blocking: boolean;
  readonly interruptionPolicy: HeadquartersInterruptionPolicy;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly sourceEntityId: string;
  readonly createdAt: string;
  readonly firstEligibleAt?: string | undefined;
  readonly expiresAt?: string | undefined;
  readonly acknowledgedAt?: string | undefined;
  readonly resolvedAt?: string | undefined;
  readonly resolutionAction?: string | undefined;
  readonly returnContext?: HeadquartersAttentionReturnContext | undefined;
  readonly deduplicationKey?: string | undefined;
  readonly metadata?: Readonly<Record<string, string | number | boolean>> | undefined;
}

const inactiveStatuses: readonly HeadquartersAttentionStatus[] = [
  'resolved',
  'dismissed',
  'expired',
  'superseded',
];

export function createHeadquartersAttentionRequest(
  input: HeadquartersAttentionRequestInput,
): HeadquartersAttentionRequest {
  if (!input.requestId.trim()) throw new Error('Attention request requires a stable requestId.');
  if (!input.title.trim()) throw new Error(`Attention request ${input.requestId} requires a title.`);
  if (!input.summary.trim()) throw new Error(`Attention request ${input.requestId} requires a summary.`);
  if (!input.reason.trim()) throw new Error(`Attention request ${input.requestId} requires a reason.`);
  if (!input.recommendedAction.trim()) {
    throw new Error(`Attention request ${input.requestId} requires a recommended action.`);
  }
  if (input.evidenceReferences.length === 0) {
    throw new Error(`Attention request ${input.requestId} requires evidence references.`);
  }
  if (input.blocking && input.interruptionPolicy === 'background_only') {
    throw new Error(`Blocking attention request ${input.requestId} cannot use background_only policy.`);
  }
  if (!input.blocking && input.interruptionPolicy === 'interrupt_immediately' && input.urgency !== 'critical') {
    throw new Error(`Optional attention request ${input.requestId} cannot interrupt immediately.`);
  }

  const deduplicationKey = normalizeAttentionRequestDeduplicationKey(
    input.deduplicationKey
      ?? [
        input.sourceSubsystem,
        input.requestType,
        input.sourceEntityId,
        ...input.evidenceReferences.map((reference) => reference.id),
      ].join(':'),
  );

  return freezeRequest({
    requestId: input.requestId,
    sourceSubsystem: input.sourceSubsystem,
    requestType: input.requestType,
    title: input.title,
    summary: input.summary,
    reason: input.reason,
    urgency: input.urgency,
    severity: input.severity,
    status: input.status ?? 'pending',
    ...(input.missionId ? { missionId: input.missionId } : {}),
    ...(input.lifecycleStage ? { lifecycleStage: input.lifecycleStage } : {}),
    recommendedRoom: input.recommendedRoom,
    recommendedAction: input.recommendedAction,
    blocking: input.blocking,
    interruptionPolicy: input.interruptionPolicy,
    evidenceReferences: cloneEvidence(input.evidenceReferences),
    sourceEntityId: input.sourceEntityId,
    createdAt: input.createdAt,
    firstEligibleAt: input.firstEligibleAt ?? input.createdAt,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    ...(input.acknowledgedAt ? { acknowledgedAt: input.acknowledgedAt } : {}),
    ...(input.resolvedAt ? { resolvedAt: input.resolvedAt } : {}),
    ...(input.resolutionAction ? { resolutionAction: input.resolutionAction } : {}),
    ...(input.returnContext ? { returnContext: cloneReturnContext(input.returnContext) } : {}),
    deduplicationKey,
    metadata: { ...(input.metadata ?? {}) },
  });
}

export function isAttentionRequestActionable(request: HeadquartersAttentionRequest): boolean {
  return !inactiveStatuses.includes(request.status);
}

export function canAttentionRequestInterrupt(request: HeadquartersAttentionRequest): boolean {
  if (!isAttentionRequestActionable(request)) return false;
  if (request.interruptionPolicy === 'background_only') return false;
  if (request.interruptionPolicy === 'queue_until_mission_complete') return false;
  if (request.interruptionPolicy === 'mention_in_next_brief') return false;
  return request.interruptionPolicy === 'interrupt_immediately'
    || request.interruptionPolicy === 'interrupt_at_safe_point';
}

export function getAttentionRequestReturnContext(
  request: HeadquartersAttentionRequest,
): HeadquartersAttentionReturnContext | undefined {
  return request.returnContext ? cloneReturnContext(request.returnContext) : undefined;
}

export function acknowledgeAttentionRequest(
  request: HeadquartersAttentionRequest,
  acknowledgedAt: string,
): HeadquartersAttentionRequest {
  return freezeRequest({
    ...cloneRequest(request),
    status: 'acknowledged',
    acknowledgedAt,
  });
}

export function resolveAttentionRequest(
  request: HeadquartersAttentionRequest,
  input: {
    readonly resolvedAt: string;
    readonly resolutionAction: string;
  },
): HeadquartersAttentionRequest {
  if (!input.resolutionAction.trim()) {
    throw new Error(`Resolution action is required for ${request.requestId}.`);
  }

  return freezeRequest({
    ...cloneRequest(request),
    status: 'resolved',
    resolvedAt: input.resolvedAt,
    resolutionAction: input.resolutionAction,
  });
}

export function supersedeAttentionRequest(
  request: HeadquartersAttentionRequest,
  supersededByRequestId: string,
): HeadquartersAttentionRequest {
  if (!supersededByRequestId.trim()) {
    throw new Error(`Superseding request id is required for ${request.requestId}.`);
  }

  return freezeRequest({
    ...cloneRequest(request),
    status: 'superseded',
    metadata: {
      ...request.metadata,
      supersededByRequestId,
    },
  });
}

export function normalizeAttentionRequestDeduplicationKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-:]+|[-:]+$/g, '')
    .trim();
}

function cloneRequest(request: HeadquartersAttentionRequest): HeadquartersAttentionRequest {
  return freezeRequest({
    ...request,
    evidenceReferences: cloneEvidence(request.evidenceReferences),
    ...(request.returnContext ? { returnContext: cloneReturnContext(request.returnContext) } : {}),
    metadata: { ...request.metadata },
  });
}

function cloneEvidence(
  references: readonly HeadquartersAttentionEvidenceReference[],
): readonly HeadquartersAttentionEvidenceReference[] {
  return Object.freeze(references.map((reference) => Object.freeze({ ...reference })));
}

function cloneReturnContext(context: HeadquartersAttentionReturnContext): HeadquartersAttentionReturnContext {
  return Object.freeze({ ...context });
}

function freezeRequest(request: HeadquartersAttentionRequest): HeadquartersAttentionRequest {
  return Object.freeze({
    ...request,
    evidenceReferences: cloneEvidence(request.evidenceReferences),
    ...(request.returnContext ? { returnContext: cloneReturnContext(request.returnContext) } : {}),
    metadata: Object.freeze({ ...request.metadata }),
  });
}
