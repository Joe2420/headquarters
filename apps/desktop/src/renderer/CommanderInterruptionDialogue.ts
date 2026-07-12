import type {
  HeadquartersAttentionRequest,
  LivingHeadquartersDecision,
  HeadquartersInterruptionSession,
} from '@headquarters/hqos';
import type { CommanderMessageCandidate } from './CommanderMessageOrchestrator';
import type { CommanderShellRoomId } from './CommanderShell';

export type CommanderInterruptionIntent =
  | 'announceAttentionRequest'
  | 'explainInterruptionReason'
  | 'requestRoomTransfer'
  | 'summarizeSubsystemEvidence'
  | 'requestResolutionAction'
  | 'acknowledgeResolution'
  | 'announceReturnToOperation'
  | 'deferOptionalRequest'
  | 'resumeSuspendedQuestion';

export interface CommanderInterruptionDialogueInput {
  readonly decision: LivingHeadquartersDecision;
  readonly relationshipMode?: 'supportive' | 'standard' | 'challenging' | undefined;
  readonly activeSession?: HeadquartersInterruptionSession | undefined;
  readonly acknowledgedRequestIds?: readonly string[] | undefined;
  readonly lifecycleStep: string;
}

export function buildCommanderInterruptionDialogue(
  input: CommanderInterruptionDialogueInput,
): readonly CommanderMessageCandidate[] {
  const request = input.decision.requestToSurface ?? input.decision.highestEligibleRequest;
  if (request === undefined) return [];
  if ((input.acknowledgedRequestIds ?? []).includes(request.requestId)) return [];

  if (input.decision.requestToSurface === undefined) {
    return [makeCandidate({
      request,
      lifecycleStep: input.lifecycleStep,
      intent: 'deferOptionalRequest',
      text: buildDeferredText(request),
    })];
  }

  const text = [
    buildAttentionText(request, input.relationshipMode ?? 'standard'),
    buildReturnText(input.decision),
  ].filter(Boolean).join('\n\n');

  return [makeCandidate({
    request,
    lifecycleStep: input.lifecycleStep,
    intent: request.blocking ? 'explainInterruptionReason' : 'announceAttentionRequest',
    text,
  })];
}

export function buildCommanderReturnDialogue(
  session: HeadquartersInterruptionSession,
): CommanderMessageCandidate {
  const question = session.CommanderQuestionSnapshot;
  const resumeText = question
    ? `Resuming the suspended question: ${question.prompt}`
    : 'Returning to the prior operation.';

  return {
    id: `interruption-return:${session.interruptionId}`,
    room: mapRoom(session.returnContext.previousRoom),
    lifecycleStep: session.lifecycleSnapshot.lifecycleStage,
    purpose: 'transition',
    text: `Review complete. ${resumeText}`,
    source: 'commander',
  };
}

export function buildCommanderResolutionDialogue(
  session: HeadquartersInterruptionSession,
): CommanderMessageCandidate | undefined {
  const result = session.resolutionResult;
  if (result === undefined) return undefined;

  return {
    id: `interruption-resolution:${session.interruptionId}:${result.action}`,
    room: mapRoom(session.interruptionRoom),
    lifecycleStep: session.lifecycleSnapshot.lifecycleStage,
    purpose: result.successful ? 'acknowledgement' : 'warning',
    text: result.successful
      ? `Request resolved. Evidence preserved: ${result.evidenceReferences.join(', ')}.`
      : 'Request remains unresolved. Headquarters will preserve the interruption session.',
    source: 'commander',
  };
}

function makeCandidate(input: {
  readonly request: HeadquartersAttentionRequest;
  readonly lifecycleStep: string;
  readonly intent: CommanderInterruptionIntent;
  readonly text: string;
}): CommanderMessageCandidate {
  return {
    id: `attention-dialogue:${input.intent}:${input.request.requestId}`,
    room: mapRoom(input.request.recommendedRoom),
    lifecycleStep: input.lifecycleStep,
    purpose: input.request.blocking ? 'warning' : 'summary',
    text: input.text,
    source: 'commander',
  };
}

function buildAttentionText(
  request: HeadquartersAttentionRequest,
  relationshipMode: 'supportive' | 'standard' | 'challenging',
): string {
  const evidence = request.evidenceReferences
    .map((reference) => reference.description ?? reference.id)
    .slice(0, relationshipMode === 'challenging' ? 3 : 2)
    .join(', ');
  const prefix = request.blocking
    ? `${titleCase(request.sourceSubsystem)} requests immediate attention.`
    : `${titleCase(request.sourceSubsystem)} has a request queued for review.`;
  const depth = relationshipMode === 'supportive'
    ? 'We will keep the current operation protected.'
    : relationshipMode === 'challenging'
      ? 'This requires discipline before continuation.'
      : 'Headquarters will preserve the current workflow.';

  return `${prefix} ${request.reason} ${depth} Evidence: ${evidence}. Required action: ${request.recommendedAction}.`;
}

function buildDeferredText(request: HeadquartersAttentionRequest): string {
  return `${titleCase(request.sourceSubsystem)} has work ready. It does not affect the active operation. I have queued it for the next safe moment.`;
}

function buildReturnText(decision: LivingHeadquartersDecision): string {
  const plan = decision.returnPlan;
  if (plan === undefined) return '';
  return `We will return to ${formatRoom(plan.returnRoom)} after review.`;
}

function mapRoom(room: string): CommanderShellRoomId {
  if (room === 'ready-room') return 'ready-room';
  if (room === 'observation-room') return 'observation';
  if (room === 'war-room') return 'war-room';
  if (room === 'debrief-theater') return 'debrief';
  if (room === 'archive') return 'archive';
  return 'command';
}

function formatRoom(room: string): string {
  return room.replace(/-/g, ' ');
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
