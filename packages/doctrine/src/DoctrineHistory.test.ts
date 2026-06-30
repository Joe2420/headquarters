import { describe, expect, it } from 'vitest';
import { createDoctrineHistoryEntry, sortDoctrineHistory } from './DoctrineHistory';
import type { DoctrineRecord } from './DoctrineRecord';

const doctrineRecord: DoctrineRecord = {
  id: 'doctrine-001',
  title: 'Wait for confirmation',
  summary: 'Wait for confirmation before entry.',
  confidence: 'validated',
  source: {
    sourceType: 'journal_entry',
    sourceId: 'journal-001',
    excerpt: 'Wait for confirmation before entry.',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DoctrineHistory', () => {
  it('creates deterministic history entries for promoted doctrine records', () => {
    const entry = createDoctrineHistoryEntry(doctrineRecord, 'promoted', {
      id: 'history-001',
      occurredAt: '2026-01-01T00:00:00.000Z',
    });

    expect(entry).toEqual({
      id: 'history-001',
      doctrineId: 'doctrine-001',
      action: 'promoted',
      summary: 'Promoted candidate to doctrine: Wait for confirmation',
      occurredAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('sorts history chronologically without mutating caller-owned entries', () => {
    const later = createDoctrineHistoryEntry(doctrineRecord, 'updated', {
      id: 'history-002',
      occurredAt: '2026-01-02T00:00:00.000Z',
    });
    const earlier = createDoctrineHistoryEntry(doctrineRecord, 'promoted', {
      id: 'history-001',
      occurredAt: '2026-01-01T00:00:00.000Z',
    });
    const entries = [later, earlier];

    expect(sortDoctrineHistory(entries).map((entry) => entry.id)).toEqual(['history-001', 'history-002']);
    expect(entries.map((entry) => entry.id)).toEqual(['history-002', 'history-001']);
  });
});
