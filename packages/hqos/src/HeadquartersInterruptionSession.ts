import type { MissionLifecycleStage } from './MissionLifecycleProjection';
import type { HeadquartersAttentionReturnContext } from './HeadquartersAttentionRequest';

export type HeadquartersInterruptionSessionStatus =
  | 'prepared'
  | 'active'
  | 'resolving'
  | 'resolved'
  | 'returning'
  | 'completed'
  | 'failed';

export interface CommanderQuestionSnapshot {
  readonly questionId: string;
  readonly prompt: string;
  readonly room: string;
  readonly intent: string;
  readonly answered: boolean;
}

export interface MissionLifecycleSnapshot {
  readonly missionId?: string | undefined;
  readonly lifecycleStage: MissionLifecycleStage;
  readonly missionState?: string | undefined;
  readonly recommendedRoom: string;
}

export interface HeadquartersInterruptionResolutionResult {
  readonly action: string;
  readonly successful: boolean;
  readonly evidenceReferences: readonly string[];
  readonly resolvedAt: string;
}

export interface HeadquartersInterruptionSession {
  readonly interruptionId: string;
  readonly attentionRequestId: string;
  readonly startedAt: string;
  readonly sourceContext: HeadquartersAttentionReturnContext;
  readonly interruptionRoom: string;
  readonly interruptionView: string;
  readonly CommanderQuestionSnapshot?: CommanderQuestionSnapshot | undefined;
  readonly lifecycleSnapshot: MissionLifecycleSnapshot;
  readonly missionContextRevision: number;
  readonly status: HeadquartersInterruptionSessionStatus;
  readonly resolutionResult?: HeadquartersInterruptionResolutionResult | undefined;
  readonly returnContext: HeadquartersAttentionReturnContext;
  readonly returnedAt?: string | undefined;
  readonly suppressTransitionReplay: boolean;
  readonly recoveryMessageShown: boolean;
}

export interface CreateHeadquartersInterruptionSessionInput {
  readonly interruptionId: string;
  readonly attentionRequestId: string;
  readonly startedAt: string;
  readonly sourceContext: HeadquartersAttentionReturnContext;
  readonly interruptionRoom: string;
  readonly interruptionView: string;
  readonly CommanderQuestionSnapshot?: CommanderQuestionSnapshot | undefined;
  readonly lifecycleSnapshot: MissionLifecycleSnapshot;
  readonly missionContextRevision: number;
}

export function createHeadquartersInterruptionSession(
  input: CreateHeadquartersInterruptionSessionInput,
): HeadquartersInterruptionSession {
  if (!input.interruptionId.trim()) throw new Error('Interruption session requires an interruptionId.');
  if (!input.attentionRequestId.trim()) throw new Error('Interruption session requires an attentionRequestId.');

  return freezeSession({
    interruptionId: input.interruptionId,
    attentionRequestId: input.attentionRequestId,
    startedAt: input.startedAt,
    sourceContext: cloneReturnContext(input.sourceContext),
    interruptionRoom: input.interruptionRoom,
    interruptionView: input.interruptionView,
    ...(input.CommanderQuestionSnapshot
      ? { CommanderQuestionSnapshot: cloneQuestion(input.CommanderQuestionSnapshot) }
      : {}),
    lifecycleSnapshot: cloneLifecycleSnapshot(input.lifecycleSnapshot),
    missionContextRevision: input.missionContextRevision,
    status: 'prepared',
    returnContext: cloneReturnContext(input.sourceContext),
    suppressTransitionReplay: true,
    recoveryMessageShown: false,
  });
}

export function activateInterruptionSession(
  session: HeadquartersInterruptionSession,
): HeadquartersInterruptionSession {
  return freezeSession({ ...cloneSession(session), status: 'active' });
}

export function markInterruptionResolving(
  session: HeadquartersInterruptionSession,
): HeadquartersInterruptionSession {
  return freezeSession({ ...cloneSession(session), status: 'resolving' });
}

export function resolveInterruptionSession(
  session: HeadquartersInterruptionSession,
  result: HeadquartersInterruptionResolutionResult,
): HeadquartersInterruptionSession {
  return freezeSession({
    ...cloneSession(session),
    status: 'resolved',
    resolutionResult: cloneResolution(result),
  });
}

export function failInterruptionSession(
  session: HeadquartersInterruptionSession,
  result: HeadquartersInterruptionResolutionResult,
): HeadquartersInterruptionSession {
  return freezeSession({
    ...cloneSession(session),
    status: 'failed',
    resolutionResult: cloneResolution({ ...result, successful: false }),
  });
}

export function beginInterruptionReturn(
  session: HeadquartersInterruptionSession,
): HeadquartersInterruptionSession {
  if (session.status !== 'resolved') {
    throw new Error(`Interruption ${session.interruptionId} cannot return before resolution.`);
  }
  return freezeSession({ ...cloneSession(session), status: 'returning' });
}

export function completeInterruptionReturn(
  session: HeadquartersInterruptionSession,
  returnedAt: string,
): HeadquartersInterruptionSession {
  if (session.status !== 'returning') {
    throw new Error(`Interruption ${session.interruptionId} must be returning before completion.`);
  }
  return freezeSession({
    ...cloneSession(session),
    status: 'completed',
    returnedAt,
  });
}

export function recoverInterruptionSessionAfterReload(
  session: HeadquartersInterruptionSession,
): HeadquartersInterruptionSession {
  if (session.status === 'completed' || session.status === 'resolved') return cloneSession(session);
  return freezeSession({
    ...cloneSession(session),
    recoveryMessageShown: true,
    suppressTransitionReplay: true,
  });
}

export function serializeInterruptionSession(session: HeadquartersInterruptionSession): string {
  return JSON.stringify(cloneSession(session));
}

export function deserializeInterruptionSession(serialized: string): HeadquartersInterruptionSession {
  const parsed = JSON.parse(serialized) as HeadquartersInterruptionSession;
  return freezeSession({
    ...parsed,
    sourceContext: cloneReturnContext(parsed.sourceContext),
    returnContext: cloneReturnContext(parsed.returnContext),
    ...(parsed.CommanderQuestionSnapshot ? { CommanderQuestionSnapshot: cloneQuestion(parsed.CommanderQuestionSnapshot) } : {}),
    lifecycleSnapshot: cloneLifecycleSnapshot(parsed.lifecycleSnapshot),
    ...(parsed.resolutionResult ? { resolutionResult: cloneResolution(parsed.resolutionResult) } : {}),
  });
}

export function canStartInterruptionSession(
  sessions: readonly HeadquartersInterruptionSession[],
  attentionRequestId: string,
): boolean {
  return !sessions.some((session) => (
    session.attentionRequestId === attentionRequestId
    && session.status !== 'completed'
    && session.status !== 'failed'
  ));
}

export function getInterruptionResumeQuestion(
  session: HeadquartersInterruptionSession,
  validQuestionIds: readonly string[],
): CommanderQuestionSnapshot | undefined {
  const question = session.CommanderQuestionSnapshot;
  if (question === undefined) return undefined;
  if (!validQuestionIds.includes(question.questionId)) return undefined;
  return cloneQuestion(question);
}

function cloneSession(session: HeadquartersInterruptionSession): HeadquartersInterruptionSession {
  return freezeSession({
    ...session,
    sourceContext: cloneReturnContext(session.sourceContext),
    returnContext: cloneReturnContext(session.returnContext),
    ...(session.CommanderQuestionSnapshot ? { CommanderQuestionSnapshot: cloneQuestion(session.CommanderQuestionSnapshot) } : {}),
    lifecycleSnapshot: cloneLifecycleSnapshot(session.lifecycleSnapshot),
    ...(session.resolutionResult ? { resolutionResult: cloneResolution(session.resolutionResult) } : {}),
  });
}

function cloneReturnContext(context: HeadquartersAttentionReturnContext): HeadquartersAttentionReturnContext {
  return Object.freeze({ ...context });
}

function cloneQuestion(question: CommanderQuestionSnapshot): CommanderQuestionSnapshot {
  return Object.freeze({ ...question });
}

function cloneLifecycleSnapshot(snapshot: MissionLifecycleSnapshot): MissionLifecycleSnapshot {
  return Object.freeze({ ...snapshot });
}

function cloneResolution(
  result: HeadquartersInterruptionResolutionResult,
): HeadquartersInterruptionResolutionResult {
  return Object.freeze({
    ...result,
    evidenceReferences: Object.freeze([...result.evidenceReferences]),
  });
}

function freezeSession(session: HeadquartersInterruptionSession): HeadquartersInterruptionSession {
  return Object.freeze({
    ...session,
    sourceContext: cloneReturnContext(session.sourceContext),
    returnContext: cloneReturnContext(session.returnContext),
    ...(session.CommanderQuestionSnapshot ? { CommanderQuestionSnapshot: cloneQuestion(session.CommanderQuestionSnapshot) } : {}),
    lifecycleSnapshot: cloneLifecycleSnapshot(session.lifecycleSnapshot),
    ...(session.resolutionResult ? { resolutionResult: cloneResolution(session.resolutionResult) } : {}),
  });
}
