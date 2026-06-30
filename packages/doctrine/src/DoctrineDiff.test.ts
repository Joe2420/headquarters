import { describe, expect, it } from 'vitest';
import { diffDoctrineRecords } from './DoctrineDiff';
import type { DoctrineRecord } from './DoctrineRecord';

const baseRecord: DoctrineRecord = {
  id: 'doctrine-001',
  title: 'Wait for confirmation',
  summary: 'Wait for confirmation before entry.',
  confidence: 'candidate',
  source: {
    sourceType: 'journal_entry',
    sourceId: 'journal-001',
    excerpt: 'Wait for confirmation.',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DoctrineDiff', () => {
  it('returns no changes for identical doctrine records', () => {
    expect(diffDoctrineRecords(baseRecord, { ...baseRecord })).toEqual({
      beforeId: 'doctrine-001',
      afterId: 'doctrine-001',
      changes: [],
      changed: false,
    });
  });

  it('returns deterministic field changes for readable doctrine comparison', () => {
    const changedRecord: DoctrineRecord = {
      ...baseRecord,
      id: 'doctrine-002',
      title: 'Wait for clean confirmation',
      confidence: 'validated',
      source: {
        sourceType: 'trade_review',
        sourceId: 'trade-review-001',
        excerpt: 'Confirmation was late.',
      },
    };

    expect(diffDoctrineRecords(baseRecord, changedRecord)).toEqual({
      beforeId: 'doctrine-001',
      afterId: 'doctrine-002',
      changed: true,
      changes: [
        {
          field: 'title',
          before: 'Wait for confirmation',
          after: 'Wait for clean confirmation',
        },
        {
          field: 'confidence',
          before: 'candidate',
          after: 'validated',
        },
        {
          field: 'source',
          before: 'journal_entry:journal-001: Wait for confirmation.',
          after: 'trade_review:trade-review-001: Confirmation was late.',
        },
      ],
    });
  });
});
