import type { DoctrineHistoryEntry, DoctrineRecord } from '@headquarters/doctrine';

export type DoctrineReviewDecision = 'approved' | 'rejected' | 'revision_requested';

export interface DoctrineReviewCandidate {
  readonly candidateId: string;
  readonly title: string;
  readonly statement: string;
  readonly sourceMissionOrJournal: string;
  readonly sourceExcerpt: string;
  readonly behaviorEvidence: string;
  readonly similarDoctrineExists: boolean;
  readonly conflictSummary: string;
  readonly proposedScope: string;
  readonly confidence: string;
}

export interface DoctrineReviewRecord {
  readonly candidateId: string;
  readonly decision: DoctrineReviewDecision;
  readonly reason: string;
  readonly decidedAt: string;
}

export interface DoctrineReviewSummary {
  readonly heading: string;
  readonly lines: readonly string[];
  readonly question: string;
  readonly actions: readonly string[];
}

export function buildDoctrineReviewSummary(candidate: DoctrineReviewCandidate): DoctrineReviewSummary {
  return {
    heading: 'A Doctrine candidate is ready for review.',
    lines: [
      `Candidate: ${candidate.title}`,
      `Statement: ${candidate.statement}`,
      `Source: ${candidate.sourceMissionOrJournal}`,
      `Evidence: ${candidate.behaviorEvidence}`,
      `Similar Doctrine: ${candidate.similarDoctrineExists ? 'Yes' : 'No'}`,
      `Conflict: ${candidate.conflictSummary || 'No conflict detected'}`,
      `Scope: ${candidate.proposedScope}`,
      `Confidence: ${candidate.confidence}`,
    ],
    question: 'Do you approve this candidate for Doctrine?',
    actions: ['Approve Doctrine', 'Reject Candidate', 'Return for Revision', 'Open Full Evidence'],
  };
}

export function recordDoctrineReviewDecision(input: {
  readonly candidateId: string;
  readonly decision: DoctrineReviewDecision;
  readonly reason?: string | undefined;
  readonly decidedAt?: string | undefined;
  readonly previous?: readonly DoctrineReviewRecord[] | undefined;
}): DoctrineReviewRecord | undefined {
  const existingFinalDecision = (input.previous ?? []).find((record) => (
    record.candidateId === input.candidateId
    && (record.decision === 'approved' || record.decision === 'rejected')
  ));

  if (existingFinalDecision !== undefined) return undefined;

  return {
    candidateId: input.candidateId,
    decision: input.decision,
    reason: input.reason?.trim() || getDefaultDoctrineReviewReason(input.decision),
    decidedAt: input.decidedAt ?? new Date().toISOString(),
  };
}

export function formatDoctrineReviewAudit(
  decision: DoctrineReviewRecord,
  result?: { readonly record?: DoctrineRecord | undefined; readonly historyEntry?: DoctrineHistoryEntry | undefined } | undefined,
): string {
  if (decision.decision === 'approved') {
    return result?.record
      ? `Approved and promoted to Doctrine: ${result.record.title}`
      : 'Approved. Promotion pending persistence.';
  }

  if (decision.decision === 'rejected') {
    return `Rejected candidate: ${decision.reason}`;
  }

  return `Returned for revision: ${decision.reason}`;
}

function getDefaultDoctrineReviewReason(decision: DoctrineReviewDecision): string {
  if (decision === 'approved') return 'Operator approved candidate for Doctrine.';
  if (decision === 'rejected') return 'Operator rejected candidate.';
  return 'Operator requested revision.';
}
