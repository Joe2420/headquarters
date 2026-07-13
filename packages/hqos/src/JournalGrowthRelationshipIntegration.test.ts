import { describe, expect, it } from 'vitest';
import { createJournalRecord, linkJournalEvidence } from './JournalRecord';
import { extractJournalKnowledge } from './JournalKnowledgeExtractionEngine';
import { reviewJournalExtractionItem } from './JournalReviewApproval';
import {
  createJournalAcademyEvidenceCandidate,
  createJournalCommanderRelationshipSignal,
} from './JournalGrowthRelationshipIntegration';

const now = '2026-07-13T00:00:00.000Z';

describe('JournalGrowthRelationshipIntegration', () => {
  it('does not treat reflection alone as Academy growth evidence', () => {
    const record = createJournalRecord({
      journalId: 'journal-1',
      recordType: 'growth_evidence',
      title: 'Growth reflection',
      rawContent: 'I waited for evidence.',
      createdAt: now,
      author: 'operator',
    });
    const item = extractJournalKnowledge(record, { now }).candidateGrowthEvidence;
    expect(item).toBeDefined();
    if (!item) throw new Error('Expected growth evidence.');
    const review = reviewJournalExtractionItem(item, {
      decisionId: 'decision-1',
      decision: 'approve',
      reviewer: 'operator',
      reason: 'Send to Academy if evidence supports it.',
      decidedAt: now,
    });

    const candidate = createJournalAcademyEvidenceCandidate(item, review);

    expect(candidate.status).toBe('ineligible');
    expect(candidate.missionEvidenceRequired).toBe(true);
  });

  it('sends mission-supported growth to Academy review only', () => {
    const record = linkJournalEvidence(createJournalRecord({
      journalId: 'journal-1',
      recordType: 'growth_evidence',
      title: 'Growth reflection',
      rawContent: 'I waited for evidence.',
      createdAt: now,
      author: 'operator',
    }), { id: 'mission-1', source: 'mission' }, { now });
    const item = extractJournalKnowledge(record, { now }).candidateGrowthEvidence;
    expect(item).toBeDefined();
    if (!item) throw new Error('Expected growth evidence.');
    const review = reviewJournalExtractionItem(item, {
      decisionId: 'decision-1',
      decision: 'approve',
      reviewer: 'operator',
      reason: 'Mission evidence supports Academy review.',
      decidedAt: now,
    });

    expect(createJournalAcademyEvidenceCandidate(item, review).status).toBe('academy_review_required');
  });

  it('creates Commander relationship signals with evidence confidence', () => {
    const record = linkJournalEvidence(createJournalRecord({
      journalId: 'journal-1',
      recordType: 'mission_reflection',
      title: 'Patience',
      rawContent: 'I waited for evidence.',
      createdAt: now,
      author: 'operator',
    }), { id: 'mission-1', source: 'mission' }, { now });
    const item = extractJournalKnowledge(record, { now }).candidateLesson;
    expect(item).toBeDefined();
    if (!item) throw new Error('Expected lesson.');

    const signal = createJournalCommanderRelationshipSignal(item);

    expect(signal.dimension).toBe('patience');
    expect(signal.confidence).toBe('forming');
  });
});
