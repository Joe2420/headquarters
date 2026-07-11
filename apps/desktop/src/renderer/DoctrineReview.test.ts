import { describe, expect, it } from 'vitest';
import {
  buildDoctrineReviewSummary,
  formatDoctrineReviewAudit,
  recordDoctrineReviewDecision,
  type DoctrineReviewCandidate,
} from './DoctrineReview';

const candidate: DoctrineReviewCandidate = {
  candidateId: 'candidate-001',
  title: 'Wait for confirmation',
  statement: 'Never authorize without confirmation.',
  sourceMissionOrJournal: 'journal-001',
  sourceExcerpt: 'I entered before confirmation.',
  behaviorEvidence: 'Repeated early authorization.',
  similarDoctrineExists: false,
  conflictSummary: '',
  proposedScope: 'War Room authorization',
  confidence: 'complete',
};

describe('DoctrineReview', () => {
  it('summarizes candidate evidence before asking for approval', () => {
    const summary = buildDoctrineReviewSummary(candidate);

    expect(summary.heading).toBe('A Doctrine candidate is ready for review.');
    expect(summary.lines).toContain('Candidate: Wait for confirmation');
    expect(summary.lines).toContain('Evidence: Repeated early authorization.');
    expect(summary.question).toBe('Do you approve this candidate for Doctrine?');
    expect(summary.actions).toContain('Approve Doctrine');
    expect(summary.actions).toContain('Reject Candidate');
  });

  it('records approval, rejection, and revision decisions deterministically', () => {
    const approved = recordDoctrineReviewDecision({
      candidateId: candidate.candidateId,
      decision: 'approved',
      decidedAt: '2026-07-10T10:00:00.000Z',
    });
    const duplicate = recordDoctrineReviewDecision({
      candidateId: candidate.candidateId,
      decision: 'approved',
      previous: approved ? [approved] : [],
    });
    const revision = recordDoctrineReviewDecision({
      candidateId: 'candidate-002',
      decision: 'revision_requested',
      reason: 'Needs narrower wording.',
      decidedAt: '2026-07-10T10:01:00.000Z',
    });

    expect(approved?.reason).toBe('Operator approved candidate for Doctrine.');
    expect(duplicate).toBeUndefined();
    expect(revision?.reason).toBe('Needs narrower wording.');
  });

  it('formats Commander-safe audit wording for decisions', () => {
    const rejected = recordDoctrineReviewDecision({
      candidateId: candidate.candidateId,
      decision: 'rejected',
      reason: 'Evidence incomplete.',
    });

    expect(rejected ? formatDoctrineReviewAudit(rejected) : '').toBe('Rejected candidate: Evidence incomplete.');
  });
});
