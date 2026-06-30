import { describe, expect, it } from 'vitest';
import { archiveJournalEntry, createJournalEntry } from '@headquarters/journal';
import {
  extractDoctrineCandidatesFromApprovedJournalEvidence,
  isApprovedDoctrineEvidence,
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
        summary: 'Wait for confirmation before entry',
        status: 'candidate',
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
          archiveId: 'archive-001',
          excerpt: 'Wait for confirmation before entry',
        },
        createdAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'candidate-2',
        title: 'Do not chase evening moves',
        summary: 'Do not chase evening moves',
        status: 'candidate',
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
          archiveId: 'archive-001',
          excerpt: 'Do not chase evening moves',
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

    expect(candidate?.status).toBe('candidate');
    expect(candidate).not.toHaveProperty('confidence');
  });
});
