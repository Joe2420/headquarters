import { describe, expect, it } from 'vitest';
import type { DoctrineCandidate } from './DoctrineCandidate';
import { promoteDoctrineCandidate } from './DoctrinePromotion';

describe('Doctrine promotion', () => {
  it('promotes candidates manually while preserving source context', () => {
    const candidate: DoctrineCandidate = {
      id: 'candidate-001',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry',
      status: 'candidate',
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
      summary: 'Wait for confirmation before entry',
      confidence: 'validated',
      source: {
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
        excerpt: 'Wait for confirmation before entry',
      },
      createdAt: '2026-01-01T00:01:00.000Z',
      updatedAt: '2026-01-01T00:01:00.000Z',
    });
    expect(candidate.status).toBe('candidate');
  });
});
