import { describe, expect, it } from 'vitest';
import { archiveJournalEntry, createJournalEntry } from '@headquarters/journal';
import {
  extractDoctrineCandidatesFromApprovedJournalEvidence,
  getDoctrineEvidenceStrength,
  isApprovedDoctrineEvidence,
  validateDoctrineCandidateForReview,
} from './DoctrineCandidate';

describe('Doctrine candidate extraction', () => {
  it('extracts traceable candidates only from approved journal archive evidence', () => {
    const approvedEntry = createJournalEntry(
      {
        content: 'Wait for confirmation before entry. Random observation. Do not chase evening moves.',
        entryDate: '2026-01-01',
      },
      {
        id: 'journal-001',
        now: '2026-01-01T00:00:00.000Z',
      },
    );
    const unapprovedEntry = createJournalEntry(
      {
        content: 'Never move the stop emotionally.',
        entryDate: '2026-01-02',
      },
      {
        id: 'journal-002',
        now: '2026-01-02T00:00:00.000Z',
      },
    );

    if (approvedEntry === undefined || unapprovedEntry === undefined) {
      throw new Error('Expected journal entries');
    }

    const approvedArchive = archiveJournalEntry(approvedEntry, {
      id: 'archive-001',
      archivedAt: '2026-01-01T00:01:00.000Z',
      tags: ['doctrine-approved'],
    });
    const unapprovedArchive = archiveJournalEntry(unapprovedEntry, {
      id: 'archive-002',
      archivedAt: '2026-01-02T00:01:00.000Z',
      tags: ['review-needed'],
    });

    const candidates = extractDoctrineCandidatesFromApprovedJournalEvidence(
      [unapprovedArchive, approvedArchive],
      {
        now: '2026-01-03T00:00:00.000Z',
        createId: (_record, _excerpt, index) => `candidate-${index + 1}`,
      },
    );

    expect(isApprovedDoctrineEvidence(approvedArchive)).toBe(true);
    expect(isApprovedDoctrineEvidence(unapprovedArchive)).toBe(false);
    expect(candidates).toEqual([
      {
        id: 'candidate-1',
        title: 'Wait for confirmation before entry',
        summary: 'Wait for confirmation before entry.',
        status: 'pending_review',
        proposedTitle: 'Wait for confirmation before entry',
        proposedRule: 'Wait for confirmation before entry.',
        rationale: 'The source journal entry from 2026-01-01 recorded an operating lesson: "Wait for confirmation before entry".',
        evidenceSummary: 'Journal entry journal-001 preserved this evidence: "Wait for confirmation before entry".',
        triggerCondition: 'Entry consideration before confirmation is visible.',
        expectedBehavior: 'Wait and collect evidence before authorization.',
        exceptionOrBoundary: 'This rule does not replace operator judgment when new evidence invalidates the original condition.',
        proposedScope: 'Entries requiring confirmation before authorization.',
        similarDoctrineIds: [],
        conflictSummary: 'No accepted Doctrine comparison has been performed yet.',
        supportingEvidenceCount: 1,
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
          archiveId: 'archive-001',
          excerpt: 'Wait for confirmation before entry',
          sourceDate: '2026-01-01',
        },
        createdAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'candidate-2',
        title: 'Do not chase evening moves',
        summary: 'Do not chase evening moves.',
        status: 'pending_review',
        proposedTitle: 'Do not chase evening moves',
        proposedRule: 'Do not chase evening moves.',
        rationale: 'The source journal entry from 2026-01-01 recorded an operating lesson: "Do not chase evening moves".',
        evidenceSummary: 'Journal entry journal-001 preserved this evidence: "Do not chase evening moves".',
        triggerCondition: 'Price has already moved and the operator feels pressure to chase.',
        expectedBehavior: 'Stand down from the prohibited behavior and remain inside the approved plan.',
        exceptionOrBoundary: 'This rule does not replace operator judgment when new evidence invalidates the original condition.',
        proposedScope: 'Operator-reviewed trading missions matching the source condition.',
        similarDoctrineIds: [],
        conflictSummary: 'No accepted Doctrine comparison has been performed yet.',
        supportingEvidenceCount: 1,
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
          archiveId: 'archive-001',
          excerpt: 'Do not chase evening moves',
          sourceDate: '2026-01-01',
        },
        createdAt: '2026-01-03T00:00:00.000Z',
      },
    ]);
  });

  it('does not auto-promote candidates into doctrine records', () => {
    const entry = createJournalEntry(
      {
        content: 'Follow the trading plan instead of improvising.',
        entryDate: '2026-01-01',
      },
      {
        id: 'journal-003',
        now: '2026-01-01T00:00:00.000Z',
      },
    );

    if (entry === undefined) throw new Error('Expected journal entry');

    const archive = archiveJournalEntry(entry, {
      id: 'archive-003',
      tags: ['approved'],
    });
    const [candidate] = extractDoctrineCandidatesFromApprovedJournalEvidence([archive], {
      now: '2026-01-01T00:02:00.000Z',
      createId: () => 'candidate-001',
    });

    expect(candidate?.status).toBe('pending_review');
    expect(candidate).not.toHaveProperty('confidence');
  });

  it('blocks placeholder candidates from review and derives evidence strength wording', () => {
    const candidate = {
      id: 'candidate-placeholder',
      title: 'Doctrine candidate requires review',
      summary: '1 supporting source surfaced a possible operating rule',
      status: 'draft' as const,
      proposedTitle: 'Doctrine candidate requires review',
      proposedRule: 'Possible operating rule',
      rationale: '',
      evidenceSummary: '',
      triggerCondition: '',
      expectedBehavior: '',
      exceptionOrBoundary: '',
      proposedScope: 'Operator-approved doctrine candidate',
      similarDoctrineIds: [],
      conflictSummary: '',
      supportingEvidenceCount: 1,
      source: {
        sourceType: 'journal_entry' as const,
        sourceId: 'journal-001',
        archiveId: 'archive-001',
        excerpt: '',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(validateDoctrineCandidateForReview(candidate).issues.map((issue) => issue.code)).toEqual([
      'placeholder_title',
      'placeholder_rule',
      'missing_rationale',
      'missing_excerpt',
      'missing_trigger',
      'missing_expected_behavior',
    ]);
    expect(getDoctrineEvidenceStrength(1)).toEqual({
      level: 'limited',
      label: 'Limited',
      description: 'one supporting source',
    });
    expect(getDoctrineEvidenceStrength(2).label).toBe('Moderate');
    expect(getDoctrineEvidenceStrength(3).label).toBe('Strong');
  });
});
