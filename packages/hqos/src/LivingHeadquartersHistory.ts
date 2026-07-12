import type { HeadquartersAttentionRequest } from './HeadquartersAttentionRequest';
import type { HeadquartersInterruptionSession } from './HeadquartersInterruptionSession';

export type LivingHeadquartersHistoryEventType =
  | 'request_created'
  | 'priority_assigned'
  | 'request_queued'
  | 'request_surfaced'
  | 'interruption_started'
  | 'room_transfer'
  | 'action_taken'
  | 'resolution'
  | 'return_completed'
  | 'request_deferred'
  | 'request_expired'
  | 'request_superseded';

export interface LivingHeadquartersHistoryEvent {
  readonly eventId: string;
  readonly eventType: LivingHeadquartersHistoryEventType;
  readonly occurredAt: string;
  readonly requestId?: string | undefined;
  readonly interruptionId?: string | undefined;
  readonly missionId?: string | undefined;
  readonly subsystem: string;
  readonly room?: string | undefined;
  readonly action?: string | undefined;
  readonly explanation: string;
  readonly evidenceReferences: readonly string[];
}

export interface LivingHeadquartersHistory {
  readonly events: readonly LivingHeadquartersHistoryEvent[];
}

export function createLivingHeadquartersHistory(
  events: readonly LivingHeadquartersHistoryEvent[],
): LivingHeadquartersHistory {
  return Object.freeze({
    events: Object.freeze(events.map(cloneEvent).sort(compareEvents)),
  });
}

export function recordAttentionRequestCreated(
  request: HeadquartersAttentionRequest,
): LivingHeadquartersHistoryEvent {
  return freezeEvent({
    eventId: `history:request:${request.requestId}:created`,
    eventType: 'request_created',
    occurredAt: request.createdAt,
    requestId: request.requestId,
    missionId: request.missionId,
    subsystem: request.sourceSubsystem,
    room: request.recommendedRoom,
    action: request.recommendedAction,
    explanation: request.reason,
    evidenceReferences: request.evidenceReferences.map((reference) => reference.id),
  });
}

export function recordAttentionRequestQueued(
  request: HeadquartersAttentionRequest,
  occurredAt: string,
): LivingHeadquartersHistoryEvent {
  return freezeEvent({
    eventId: `history:request:${request.requestId}:queued:${occurredAt}`,
    eventType: 'request_queued',
    occurredAt,
    requestId: request.requestId,
    missionId: request.missionId,
    subsystem: request.sourceSubsystem,
    room: request.recommendedRoom,
    action: request.recommendedAction,
    explanation: `Commander deferred ${request.title}: ${request.reason}`,
    evidenceReferences: request.evidenceReferences.map((reference) => reference.id),
  });
}

export function recordInterruptionStarted(
  session: HeadquartersInterruptionSession,
): LivingHeadquartersHistoryEvent {
  return freezeEvent({
    eventId: `history:interruption:${session.interruptionId}:started`,
    eventType: 'interruption_started',
    occurredAt: session.startedAt,
    requestId: session.attentionRequestId,
    interruptionId: session.interruptionId,
    missionId: session.lifecycleSnapshot.missionId,
    subsystem: 'commander',
    room: session.interruptionRoom,
    action: 'interrupt_and_preserve_context',
    explanation: 'Commander interrupted the current operation and preserved return context.',
    evidenceReferences: [session.attentionRequestId],
  });
}

export function recordInterruptionCompleted(
  session: HeadquartersInterruptionSession,
): LivingHeadquartersHistoryEvent | undefined {
  if (!session.returnedAt) return undefined;
  return freezeEvent({
    eventId: `history:interruption:${session.interruptionId}:completed`,
    eventType: 'return_completed',
    occurredAt: session.returnedAt,
    requestId: session.attentionRequestId,
    interruptionId: session.interruptionId,
    missionId: session.lifecycleSnapshot.missionId,
    subsystem: 'commander',
    room: session.returnContext.previousRoom,
    action: 'return_to_operation',
    explanation: 'Commander returned the operator to the preserved operation.',
    evidenceReferences: [session.attentionRequestId],
  });
}

export function listHistoryByMission(
  history: LivingHeadquartersHistory,
  missionId: string,
): readonly LivingHeadquartersHistoryEvent[] {
  return Object.freeze(history.events.filter((event) => event.missionId === missionId).map(cloneEvent));
}

export function listHistoryBySubsystem(
  history: LivingHeadquartersHistory,
  subsystem: string,
): readonly LivingHeadquartersHistoryEvent[] {
  return Object.freeze(history.events.filter((event) => event.subsystem === subsystem).map(cloneEvent));
}

export function listUnresolvedRequests(
  requests: readonly HeadquartersAttentionRequest[],
): readonly HeadquartersAttentionRequest[] {
  return Object.freeze(requests.filter((request) => (
    request.status !== 'resolved'
    && request.status !== 'dismissed'
    && request.status !== 'expired'
    && request.status !== 'superseded'
  )));
}

export function listCompletedInterruptions(
  sessions: readonly HeadquartersInterruptionSession[],
): readonly HeadquartersInterruptionSession[] {
  return Object.freeze(sessions.filter((session) => session.status === 'completed'));
}

export function reconstructInterruptionSession(
  sessions: readonly HeadquartersInterruptionSession[],
  interruptionId: string,
): HeadquartersInterruptionSession | undefined {
  return sessions.find((session) => session.interruptionId === interruptionId);
}

export function explainCommanderInterruption(
  history: LivingHeadquartersHistory,
  interruptionId: string,
): string | undefined {
  return history.events.find((event) => (
    event.interruptionId === interruptionId
    && event.eventType === 'interruption_started'
  ))?.explanation;
}

export function explainCommanderDeferral(
  history: LivingHeadquartersHistory,
  requestId: string,
): string | undefined {
  return history.events.find((event) => (
    event.requestId === requestId
    && event.eventType === 'request_queued'
  ))?.explanation;
}

export function buildMissionDossierOrchestrationSummary(
  history: LivingHeadquartersHistory,
  missionId: string,
): readonly string[] {
  return Object.freeze(listHistoryByMission(history, missionId)
    .filter((event) => [
      'interruption_started',
      'request_queued',
      'resolution',
      'return_completed',
    ].includes(event.eventType))
    .map((event) => `${event.eventType}: ${event.explanation}`));
}

export function serializeLivingHeadquartersHistory(history: LivingHeadquartersHistory): string {
  return JSON.stringify(history.events);
}

export function deserializeLivingHeadquartersHistory(serialized: string): LivingHeadquartersHistory {
  const parsed = JSON.parse(serialized) as LivingHeadquartersHistoryEvent[];
  return createLivingHeadquartersHistory(parsed);
}

function compareEvents(left: LivingHeadquartersHistoryEvent, right: LivingHeadquartersHistoryEvent): number {
  return left.occurredAt.localeCompare(right.occurredAt)
    || left.eventId.localeCompare(right.eventId);
}

function cloneEvent(event: LivingHeadquartersHistoryEvent): LivingHeadquartersHistoryEvent {
  return freezeEvent({
    ...event,
    evidenceReferences: Object.freeze([...event.evidenceReferences]),
  });
}

function freezeEvent(event: LivingHeadquartersHistoryEvent): LivingHeadquartersHistoryEvent {
  return Object.freeze({
    ...event,
    evidenceReferences: Object.freeze([...event.evidenceReferences]),
  });
}
