import { describe, expect, it } from 'vitest';
import { createDoctrineRecord, InMemoryDoctrineRepository } from './DoctrineRecord';

describe('Doctrine records', () => {
  it('creates trimmed doctrine records distinct from journal evidence', () => {
    const record = createDoctrineRecord(
      {
        title: ' Wait for confirmation ',
        summary: ' Do not enter before confirmation appears. ',
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
          excerpt: ' Waited for confirmation and avoided chase. ',
        },
      },
      {
        id: 'doctrine-001',
        now: '2026-01-01T00:00:00.000Z',
      },
    );

    expect(record).toEqual({
      id: 'doctrine-001',
      title: 'Wait for confirmation',
      summary: 'Do not enter before confirmation appears.',
      confidence: 'validated',
      source: {
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
        excerpt: 'Waited for confirmation and avoided chase.',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('stores and loads doctrine records deterministically', async () => {
    const repository = new InMemoryDoctrineRepository();
    const record = createDoctrineRecord(
      {
        title: 'Trust valid stops',
        summary: 'Do not move the stop emotionally.',
        source: {
          sourceType: 'trade_review',
          sourceId: 'trade-review-001',
        },
      },
      {
        id: 'doctrine-002',
        now: '2026-01-01T00:00:00.000Z',
      },
    );

    if (record === undefined) throw new Error('Expected doctrine record');

    await repository.save(record);

    expect(await repository.getById('doctrine-002')).toEqual(record);
    expect(await repository.list()).toEqual([record]);
  });
});
