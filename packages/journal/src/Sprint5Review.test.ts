import { describe, expect, it } from 'vitest';
import { archiveJournalEntry } from './JournalArchive';
import { createDailyReflection } from './DailyReflection';
import { createGrowthEvent, isGrowthEventTraceable } from './GrowthEvent';
import { createJournalEntry } from './JournalEntry';
import { searchJournalEntries } from './JournalSearch';
import { buildJournalTimeline } from './JournalTimeline';
import { createTradeReview } from './TradeReview';

describe('Sprint 5 Journal System Review', () => {
  it('confirms the journal subsystem surfaces remain distinct and evidence-oriented', () => {
    const journalEntry = createJournalEntry(
      {
        content: 'Waited for confirmation and protected capital.',
        entryDate: '2026-06-29',
        mood: 'Calm',
        marketConditions: 'Range',
      },
      {
        id: 'journal-001',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    const reflection = createDailyReflection(
      {
        reflectionDate: '2026-06-29',
        behaviorSummary: 'Paused before acting.',
        emotionalState: 'Composed.',
        disciplineObservation: 'Followed the plan.',
        journalEntryId: 'journal-001',
      },
      {
        id: 'reflection-001',
        now: '2026-06-29T21:00:00.000Z',
      },
    );
    const tradeReview = createTradeReview(
      {
        tradeId: 'trade-001',
        reviewDate: '2026-06-30',
        followedPlan: true,
        emotionalState: 'Focused.',
        whatWentWell: 'Waited for setup.',
        whatToImprove: 'Document exit earlier.',
        lessonsLearned: 'Preparation reduced hesitation.',
        wouldTakeAgain: true,
        journalEntryId: 'journal-001',
      },
      {
        id: 'trade-review-001',
        now: '2026-06-30T21:00:00.000Z',
      },
    );
    const growthEvent = createGrowthEvent(
      {
        eventDate: '2026-07-01',
        title: 'Patience reinforced',
        description: 'Journal evidence shows improved patience.',
        category: 'patience',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
      },
      {
        id: 'growth-001',
        now: '2026-07-01T21:00:00.000Z',
      },
    );
    if (
      journalEntry === undefined
      || reflection === undefined
      || tradeReview === undefined
      || growthEvent === undefined
    ) {
      throw new Error('Expected Sprint 5 review fixtures');
    }

    const timeline = buildJournalTimeline({
      journalEntries: [journalEntry],
      dailyReflections: [reflection],
      tradeReviews: [tradeReview],
      growthEvents: [growthEvent],
    });
    const search = searchJournalEntries([journalEntry], { text: 'protected capital' });
    const archived = archiveJournalEntry(journalEntry, {
      id: 'archive-001',
      archivedAt: '2026-07-02T21:00:00.000Z',
      classificationStatus: 'classified',
      tags: ['reviewed'],
    });

    expect(journalEntry.classificationStatus).toBe('unclassified');
    expect(reflection).not.toHaveProperty('tradeId');
    expect(tradeReview).not.toHaveProperty('reflectionDate');
    expect(tradeReview).not.toHaveProperty('marketForecast');
    expect(isGrowthEventTraceable(growthEvent)).toBe(true);
    expect(growthEvent.rewardStatus).toBe('not_awarded');
    expect(timeline.entries.map((entry) => entry.type)).toEqual([
      'daily_reflection',
      'journal_entry',
      'trade_review',
      'growth_event',
    ]);
    expect(search.entries.map((entry) => entry.id)).toEqual(['journal-001']);
    expect(archived.rawEntry.classificationStatus).toBe('unclassified');
    expect(archived.metadata.classificationStatus).toBe('classified');
  });
});
