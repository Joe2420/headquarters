import { describe, expect, it } from 'vitest';
import { createJournalRecord, linkJournalEvidence } from './JournalRecord';
import { extractJournalKnowledge } from './JournalKnowledgeExtractionEngine';
import { reviewJournalExtractionItem } from './JournalReviewApproval';

const now = '2026-07-13T00:00:00.000Z';

const record = linkJournalEvidence(createJournalRecord({
  journalId: 'journal-1',
  recordType: 'mission_reflection',
  title: 'Reflection',
  rawContent: 'I waited for evidence and respected risk before action.',
  createdAt: now,
  author: 'operator',
}), { id: 'mission-1', source: 'mission' }, { now });

describe('JournalReviewApproval', () => {
  it('approves eligible extraction as evidence while preserving source excerpt', () => {
    const lesson = extractJournalKnowledge(record, { now }).candidateLesson;
    expect(lesson).toBeDefined();
    if (!lesson) throw new Error('Expected lesson.');

    const result = reviewJournalExtractionItem(lesson, {
      decisionId: 'decision-1',
      decision: 'approve',
      reviewer: 'operator',
      reason: 'Lesson matches the mission evidence.',
      decidedAt: now,
    });

    expect(result.approvedForEvidence).toBe(true);
    expect(result.decision.sourceExcerpt).toContain('waited');
  });

  it('requires revised text on revise decisions', () => {
    const commitment = extractJournalKnowledge(record, { now }).candidateCommitment;
    expect(commitment).toBeDefined();
    if (!commitment) throw new Error('Expected commitment.');

    const result = reviewJournalExtractionItem(commitment, {
      decisionId: 'decision-1',
      decision: 'revise',
      reviewer: 'operator',
      reason: 'Make the commitment observable.',
      decidedAt: now,
      revisedText: 'Before acting, state evidence and risk.',
    });

    expect(result.requiresRevision).toBe(true);
    expect(result.decision.reviewedText).toBe('Before acting, state evidence and risk.');
  });

  it('keeps rejected extraction as reflection only', () => {
    const tag = extractJournalKnowledge(record, { now }).candidateBehaviorTag;
    expect(tag).toBeDefined();
    if (!tag) throw new Error('Expected tag.');

    const result = reviewJournalExtractionItem(tag, {
      decisionId: 'decision-1',
      decision: 'reject',
      reviewer: 'operator',
      reason: 'Not supported enough.',
      decidedAt: now,
    });

    expect(result.remainsReflectionOnly).toBe(true);
    expect(result.approvedForEvidence).toBe(false);
  });

  it('does not directly approve Doctrine or Academy subsystems', () => {
    const source = extractJournalKnowledge(record, { now }).candidateGrowthEvidence;
    expect(source).toBeDefined();
    if (!source) throw new Error('Expected growth evidence.');

    const result = reviewJournalExtractionItem(source, {
      decisionId: 'decision-1',
      decision: 'approve',
      reviewer: 'operator',
      reason: 'Send to Academy review.',
      decidedAt: now,
    });

    expect(result.subsystemApprovalRequired).toEqual(['academy']);
    expect(result.decision.createsAcademyEvidence).toBe(true);
  });
});
