import type {
  HeadquartersAttentionRequest,
  HeadquartersAttentionStatus,
  HeadquartersInterruptionSession,
} from '@headquarters/hqos';

export type HeadquartersRequestWorkflowKind =
  | 'guardian-interruption'
  | 'doctrine-review'
  | 'journal-follow-up'
  | 'academy-recognition'
  | 'intelligence-contradiction';

export type HeadquartersRequestWorkflowAction =
  | 'review_now'
  | 'defer'
  | 'open_evidence'
  | 'acknowledge'
  | 'resolve'
  | 'approve'
  | 'reject'
  | 'return_for_revision'
  | 'write_entry'
  | 'clarify_evidence'
  | 'return_to_operation';

export interface HeadquartersRequestWorkflowStep {
  readonly id: string;
  readonly label: string;
  readonly action: HeadquartersRequestWorkflowAction;
  readonly primary: boolean;
  readonly enabled: boolean;
}

export interface HeadquartersRequestWorkflow {
  readonly workflowId: string;
  readonly kind: HeadquartersRequestWorkflowKind;
  readonly requestId: string;
  readonly title: string;
  readonly room: string;
  readonly commanderSummary: string;
  readonly evidenceSummary: string;
  readonly steps: readonly HeadquartersRequestWorkflowStep[];
  readonly returnContextAvailable: boolean;
  readonly statusAfterPrimary: HeadquartersAttentionStatus;
}

export interface HeadquartersRequestWorkflowResolution {
  readonly requestId: string;
  readonly action: HeadquartersRequestWorkflowAction;
  readonly status: HeadquartersAttentionStatus;
  readonly returnToPreviousContext: boolean;
  readonly auditSummary: string;
}

export function buildHeadquartersRequestWorkflow(
  request: HeadquartersAttentionRequest,
  session?: HeadquartersInterruptionSession | undefined,
): HeadquartersRequestWorkflow {
  const kind = getWorkflowKind(request);
  return Object.freeze({
    workflowId: `workflow:${kind}:${request.requestId}`,
    kind,
    requestId: request.requestId,
    title: request.title,
    room: request.recommendedRoom,
    commanderSummary: buildWorkflowSummary(request, kind),
    evidenceSummary: summarizeEvidence(request),
    steps: Object.freeze(buildWorkflowSteps(kind, request)),
    returnContextAvailable: session !== undefined || request.returnContext !== undefined,
    statusAfterPrimary: kind === 'academy-recognition' ? 'resolved' : 'in_progress',
  });
}

export function resolveHeadquartersRequestWorkflow(
  workflow: HeadquartersRequestWorkflow,
  action: HeadquartersRequestWorkflowAction,
): HeadquartersRequestWorkflowResolution {
  const allowed = workflow.steps.find((step) => step.action === action && step.enabled);
  if (allowed === undefined) {
    throw new Error(`Action ${action} is not available for workflow ${workflow.workflowId}.`);
  }

  const status = getStatusForAction(action);
  return Object.freeze({
    requestId: workflow.requestId,
    action,
    status,
    returnToPreviousContext: status === 'resolved' || action === 'defer',
    auditSummary: `${workflow.kind}:${action}:${status}`,
  });
}

export function getWorkflowKind(request: HeadquartersAttentionRequest): HeadquartersRequestWorkflowKind {
  if (request.sourceSubsystem === 'guardian' || request.requestType === 'guardian_lockout_active') {
    return 'guardian-interruption';
  }
  if (request.sourceSubsystem === 'doctrine') return 'doctrine-review';
  if (request.sourceSubsystem === 'journal') return 'journal-follow-up';
  if (request.sourceSubsystem === 'academy') return 'academy-recognition';
  if (request.sourceSubsystem === 'intelligence') return 'intelligence-contradiction';
  if (request.requestType === 'consequence_recovery_required') return 'guardian-interruption';
  return 'journal-follow-up';
}

function buildWorkflowSummary(
  request: HeadquartersAttentionRequest,
  kind: HeadquartersRequestWorkflowKind,
): string {
  if (kind === 'guardian-interruption') {
    return `Guardian evidence requires review before this operation can continue. ${request.reason}`;
  }
  if (kind === 'doctrine-review') {
    return `Doctrine candidate review is ready. ${request.summary}`;
  }
  if (kind === 'journal-follow-up') {
    return `Journal follow-up is linked to mission evidence. ${request.reason}`;
  }
  if (kind === 'academy-recognition') {
    return `Academy recognition is evidence-backed and can wait for standby. ${request.reason}`;
  }
  return `Intelligence has identified conflicting or missing evidence. ${request.reason}`;
}

function summarizeEvidence(request: HeadquartersAttentionRequest): string {
  return request.evidenceReferences
    .map((reference) => reference.description ?? `${reference.source}:${reference.id}`)
    .join('; ');
}

function buildWorkflowSteps(
  kind: HeadquartersRequestWorkflowKind,
  request: HeadquartersAttentionRequest,
): readonly HeadquartersRequestWorkflowStep[] {
  if (kind === 'guardian-interruption') {
    return [
      step('review', 'Review Guardian evidence', 'review_now', true, true),
      step('resolve', 'Resolve restriction', 'resolve', false, request.blocking),
      step('evidence', 'Open evidence', 'open_evidence', false, true),
    ];
  }
  if (kind === 'doctrine-review') {
    return [
      step('approve', 'Approve candidate', 'approve', true, true),
      step('reject', 'Reject candidate', 'reject', false, true),
      step('revision', 'Return for revision', 'return_for_revision', false, true),
      step('defer', 'Defer review', 'defer', false, !request.blocking),
      step('evidence', 'Open full evidence', 'open_evidence', false, true),
    ];
  }
  if (kind === 'journal-follow-up') {
    return [
      step('write', 'Write linked Journal entry', 'write_entry', true, true),
      step('evidence', 'Open mission evidence', 'open_evidence', false, true),
      step('defer', 'Defer follow-up', 'defer', false, !request.blocking),
    ];
  }
  if (kind === 'academy-recognition') {
    return [
      step('acknowledge', 'Acknowledge recognition', 'acknowledge', true, true),
      step('defer', 'Hold for standby', 'defer', false, true),
    ];
  }
  return [
    step('clarify', 'Clarify evidence', 'clarify_evidence', true, true),
    step('evidence', 'Open conflicting evidence', 'open_evidence', false, true),
  ];
}

function step(
  id: string,
  label: string,
  action: HeadquartersRequestWorkflowAction,
  primary: boolean,
  enabled: boolean,
): HeadquartersRequestWorkflowStep {
  return Object.freeze({ id, label, action, primary, enabled });
}

function getStatusForAction(action: HeadquartersRequestWorkflowAction): HeadquartersAttentionStatus {
  if (action === 'defer') return 'queued';
  if (
    action === 'resolve'
    || action === 'approve'
    || action === 'reject'
    || action === 'write_entry'
    || action === 'acknowledge'
    || action === 'clarify_evidence'
  ) {
    return 'resolved';
  }
  if (action === 'return_for_revision') return 'in_progress';
  return 'acknowledged';
}
