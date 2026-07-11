import { describe, expect, it } from 'vitest';
import { extractDoctrineCandidatesFromApprovedJournalEvidence } from './DoctrineCandidate';
import { diffDoctrineRecords } from './DoctrineDiff';
import { createDoctrineHistoryEntry } from './DoctrineHistory';
import { promoteDoctrineCandidate } from './DoctrinePromotion';
import { buildTradingPlanDoctrineReferences } from './TradingPlanDoctrine';
import { archiveJournalEntry, createJournalEntry } from '@headquarters/journal';

describe('Sprint 6 Doctrine Review', () => {
  it('confirms Doctrine remains evidence-oriented, explicit, and read-only where required', () => {
    const journalEntry = createJournalEntry(
      {
        content: 'Always wait for confirmation before entering.',
        entryDate: '2026-06-30',
        mood: 'Calm',
        marketConditions: 'Range',
      },
      {
        id: 'journal-001',
        now: '2026-06-30T19:00:00.000Z',
      },
    );

    expect(journalEntry).toBeDefined();
    if (journalEntry === undefined) return;

    const archivedJournalEntry = archiveJournalEntry(journalEntry, {
      id: 'archive-001',
      archivedAt: '2026-06-30T20:00:00.000Z',
      classificationStatus: 'classified',
      tags: ['doctrine-approved'],
    });

    const candidates = extractDoctrineCandidatesFromApprovedJournalEvidence([archivedJournalEntry], {
      now: '2026-06-30T21:00:00.000Z',
    });
    const candidate = candidates[0];

    expect(candidate).toBeDefined();
    if (candidate === undefined) return;

    const promoted = promoteDoctrineCandidate(candidate, {
      id: 'doctrine-001',
      promotedAt: '2026-06-30T22:00:00.000Z',
    });
    const historyEntry = createDoctrineHistoryEntry(promoted, 'promoted', {
      id: 'history-001',
      occurredAt: '2026-06-30T22:00:00.000Z',
    });
    const changedRecord = {
      ...promoted,
      id: 'doctrine-002',
      title: 'Wait for clean confirmation',
    };
    const diff = diffDoctrineRecords(promoted, changedRecord);
    const references = buildTradingPlanDoctrineReferences({
      id: 'primary-trading-plan',
      name: 'Primary Trading Plan',
    }, [promoted]);

    expect(candidate.status).toBe('pending_review');
    expect(promoted.confidence).toBe('validated');
    expect(historyEntry.action).toBe('promoted');
    expect(diff.changed).toBe(true);
    expect(references).toEqual([
      {
        tradingPlanId: 'primary-trading-plan',
        tradingPlanName: 'Primary Trading Plan',
        doctrineId: 'doctrine-001',
        title: promoted.title,
        summary: promoted.summary,
        sourceId: 'journal-001',
      },
    ]);
  });
});
