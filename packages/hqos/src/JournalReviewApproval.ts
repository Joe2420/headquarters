import type { JournalKnowledgeExtractionItem } from './JournalKnowledgeExtractionEngine';

export type JournalReviewDecisionType = 'approve' | 'revise' | 'reject' | 'keep_as_reflection';

export interface JournalReviewDecision {
  readonly decisionId: string;
  readonly extractionId: string;
  readonly journalId: string;
  readonly decision: JournalReviewDecisionType;
  readonly reviewedText: string;
  readonly reviewer: string;
  readonly reason: string;
  readonly decidedAt: string;
  readonly sourceExcerpt: string;
  readonly createsDoctrineCandidate: boolean;
  readonly createsAcademyEvidence: boolean;
}

export interface JournalReviewApprovalResult {
  readonly decision: JournalReviewDecision;
  readonly approvedForEvidence: boolean;
  readonly requiresRevision: boolean;
  readonly remainsReflectionOnly: boolean;
  readonly subsystemApprovalRequired: readonly string[];
}

export function reviewJournalExtractionItem(
  item: JournalKnowledgeExtractionItem,
  input: {
    readonly decisionId: string;
    readonly decision: JournalReviewDecisionType;
    readonly reviewer: string;
    readonly reason: string;
    readonly decidedAt: string;
    readonly revisedText?: string | undefined;
  },
): JournalReviewApprovalResult {
  const reviewedText = input.decision === 'revise'
    ? requireText(input.revisedText, 'Revised Journal extraction requires revisedText.')
    : item.proposedText;
  const approvedForEvidence = input.decision === 'approve' && item.eligibility !== 'ineligible';
  const createsDoctrineCandidate = approvedForEvidence && item.extractionType === 'doctrine_source';
  const createsAcademyEvidence = approvedForEvidence && item.extractionType === 'growth_evidence';

  return Object.freeze({
    decision: Object.freeze({
      decisionId: requireText(input.decisionId, 'Journal review decision requires decisionId.'),
      extractionId: item.extractionId,
      journalId: item.journalId,
      decision: input.decision,
      reviewedText,
      reviewer: requireText(input.reviewer, 'Journal review decision requires reviewer.'),
      reason: requireText(input.reason, 'Journal review decision requires reason.'),
      decidedAt: requireText(input.decidedAt, 'Journal review decision requires decidedAt.'),
      sourceExcerpt: item.sourceExcerpt,
      createsDoctrineCandidate,
      createsAcademyEvidence,
    }),
    approvedForEvidence,
    requiresRevision: input.decision === 'revise',
    remainsReflectionOnly: input.decision === 'keep_as_reflection' || input.decision === 'reject',
    subsystemApprovalRequired: Object.freeze([
      ...(createsDoctrineCandidate ? ['doctrine'] : []),
      ...(createsAcademyEvidence ? ['academy'] : []),
    ]),
  });
}

function requireText(value: string | undefined, message: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(message);
  return normalized;
}
