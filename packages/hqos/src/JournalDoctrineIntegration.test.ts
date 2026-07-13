import { describe, expect, it } from 'vitest';
import { createJournalRecord, linkJournalEvidence } from './JournalRecord';
import { extractJournalKnowledge } from './JournalKnowledgeExtractionEngine';
import { reviewJournalExtractionItem } from './JournalReviewApproval';
import { createJournalDoctrineSourceDraft } from './JournalDoctrineIntegration';

const now = '2026-07-13T00:00:00.000Z';

function reviewedDoctrineSource(rawContent: string) {
  const record = linkJournalEvidence(linkJournalEvidence(createJournalRecord({
    journalId: 'journal-1',
    recordType: 'doctrine_source',
    title: 'Doctrine source',
    rawContent,
    createdAt: now,
    author: 'operator',
  }), { id: 'mission-1', source: 'mission' }, { now }), { id: 'mission-2', source: 'mission' }, { now });
  const extraction = extractJournalKnowledge(record, { now }).candidateDoctrineSource;
  expect(extraction).toBeDefined();
  if (!extraction) throw new Error('Expected doctrine source.');
  const review = reviewJournalExtractionItem(extraction, {
    decisionId: 'decision-1',
    decision: 'approve',
    reviewer: 'operator',
    reason: 'Source should move to Doctrine review.',
    decidedAt: now,
  });
  return { extraction, review };
}

describe('JournalDoctrineIntegration', () => {
  it('keeps incomplete doctrine source as draft', () => {
    const { extraction, review } = reviewedDoctrineSource('I waited for volume confirmation.');

    const draft = createJournalDoctrineSourceDraft({ extraction, review });

    expect(draft.status).toBe('draft');
    expect(draft.missingFields).toContain('trigger');
  });

  it('routes complete source to Doctrine review without approving Doctrine', () => {
    const { extraction, review } = reviewedDoctrineSource('If volume confirms then wait for structure when risk is declared unless invalidation breaks.');

    const draft = createJournalDoctrineSourceDraft({ extraction, review });

    expect(draft.status).toBe('ready_for_doctrine_review');
    expect(review.subsystemApprovalRequired).toEqual(['doctrine']);
  });

  it('blocks duplicate accepted Doctrine text', () => {
    const { extraction, review } = reviewedDoctrineSource('If volume confirms then wait for structure when risk is declared unless invalidation breaks.');

    const draft = createJournalDoctrineSourceDraft({
      extraction,
      review,
      existingDoctrineTexts: [{ doctrineId: 'doctrine-1', text: review.decision.reviewedText }],
    });

    expect(draft.status).toBe('blocked');
    expect(draft.duplicateDoctrineIds).toEqual(['doctrine-1']);
  });
});
