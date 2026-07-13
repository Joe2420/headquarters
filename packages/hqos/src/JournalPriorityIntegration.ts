import type { HeadquartersAttentionRequest } from './HeadquartersAttentionRequest';
import type { JournalWorkflowSnapshot } from './JournalWorkflowEngine';

export type JournalAttentionTiming = 'immediate' | 'safe_point' | 'standby' | 'background';

export interface JournalPriorityRequestCandidate {
  readonly id: string;
  readonly timing: JournalAttentionTiming;
  readonly title: string;
  readonly reason: string;
  readonly recommendedAction: string;
  readonly duplicateKey: string;
  readonly blocking: boolean;
}

export function buildJournalPriorityRequestCandidate(
  workflow: JournalWorkflowSnapshot,
): JournalPriorityRequestCandidate | undefined {
  if (!workflow.activeRecord && workflow.currentState === 'idle') {
    return {
      id: 'journal:daily-reflection',
      timing: 'standby',
      title: 'Daily reflection available',
      reason: 'Journal reflection can be completed when Headquarters is standing by.',
      recommendedAction: 'Open Journal Inbox',
      duplicateKey: 'journal:daily-reflection',
      blocking: false,
    };
  }

  if (workflow.blocker?.source === 'guardian') {
    return {
      id: `journal:${workflow.blocker.blockerId}`,
      timing: 'immediate',
      title: 'Guardian recovery reflection required',
      reason: workflow.blocker.reason,
      recommendedAction: 'Complete recovery reflection',
      duplicateKey: `journal:guardian:${workflow.blocker.blockerId}`,
      blocking: true,
    };
  }

  if (workflow.currentState === 'reflection_required') {
    return {
      id: `journal:${workflow.activeRecord?.journalId ?? 'reflection'}`,
      timing: 'safe_point',
      title: 'Journal reflection pending',
      reason: 'A recorded Journal entry needs reflection before lessons can be reviewed.',
      recommendedAction: 'Continue Journal reflection',
      duplicateKey: `journal:reflection:${workflow.activeRecord?.journalId ?? 'pending'}`,
      blocking: false,
    };
  }

  if (workflow.currentState === 'awaiting_review' || workflow.currentState === 'extraction_available') {
    return {
      id: `journal:${workflow.activeRecord?.journalId ?? 'review'}`,
      timing: 'standby',
      title: 'Journal review available',
      reason: 'Derived Journal knowledge requires operator review.',
      recommendedAction: 'Review Journal extraction',
      duplicateKey: `journal:review:${workflow.activeRecord?.journalId ?? 'pending'}`,
      blocking: false,
    };
  }

  return undefined;
}

export function toJournalAttentionRequest(
  candidate: JournalPriorityRequestCandidate,
  now: string,
): HeadquartersAttentionRequest {
  return {
    requestId: candidate.id,
    sourceSubsystem: 'journal',
    requestType: candidate.timing === 'standby' ? 'journal_reflection_available' : 'journal_follow_up_required',
    title: candidate.title,
    summary: candidate.reason,
    reason: candidate.reason,
    urgency: candidate.timing === 'immediate'
      ? 'critical'
      : candidate.timing === 'safe_point'
        ? 'soon'
        : candidate.timing === 'standby'
          ? 'routine'
          : 'background',
    severity: candidate.blocking ? 'blocking' : 'notice',
    status: 'pending',
    recommendedRoom: 'command-center',
    recommendedAction: candidate.recommendedAction,
    blocking: candidate.blocking,
    interruptionPolicy: candidate.timing === 'immediate'
      ? 'interrupt_immediately'
      : candidate.timing === 'safe_point'
        ? 'interrupt_at_safe_point'
        : candidate.timing === 'standby'
          ? 'mention_in_next_brief'
          : 'background_only',
    evidenceReferences: [],
    sourceEntityId: candidate.id,
    createdAt: now,
    firstEligibleAt: now,
    deduplicationKey: candidate.duplicateKey,
    metadata: { timing: candidate.timing },
  };
}

export function dedupeJournalPriorityRequests(
  requests: readonly JournalPriorityRequestCandidate[],
): readonly JournalPriorityRequestCandidate[] {
  const map = new Map<string, JournalPriorityRequestCandidate>();
  for (const request of requests) {
    if (!map.has(request.duplicateKey)) map.set(request.duplicateKey, request);
  }
  return [...map.values()];
}
