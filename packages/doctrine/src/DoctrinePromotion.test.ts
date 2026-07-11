import { describe, expect, it } from 'vitest';
import type { DoctrineCandidate } from './DoctrineCandidate';
import { promoteDoctrineCandidate } from './DoctrinePromotion';

describe('Doctrine promotion', () => {
  it('promotes candidates manually while preserving source context', () => {
    const candidate: DoctrineCandidate = {
      id: 'candidate-001',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry.',
      status: 'pending_review',
      proposedTitle: 'Wait for confirmation',
      proposedRule: 'Wait for confirmation before entry.',
      rationale: 'Journal evidence shows premature entries require confirmation.',
      evidenceSummary: 'Journal entry journal-001 records waiting for confirmation.',
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
      },
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const record = promoteDoctrineCandidate(candidate, {
      id: 'doctrine-001',
      promotedAt: '2026-01-01T00:01:00.000Z',
    });

    expect(record).toEqual({
      id: 'doctrine-001',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry.',
      confidence: 'validated',
      source: {
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
        excerpt: 'Wait for confirmation before entry',
      },
      createdAt: '2026-01-01T00:01:00.000Z',
      updatedAt: '2026-01-01T00:01:00.000Z',
    });
    expect(candidate.status).toBe('pending_review');
  });

  it('does not promote placeholder candidates', () => {
    const candidate: DoctrineCandidate = {
      id: 'candidate-placeholder',
      title: 'Doctrine candidate requires review',
      summary: 'Possible operating rule',
      status: 'draft',
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
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
        archiveId: 'archive-001',
        excerpt: '',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(() => promoteDoctrineCandidate(candidate)).toThrow('Doctrine candidate cannot be promoted');
  });
});
