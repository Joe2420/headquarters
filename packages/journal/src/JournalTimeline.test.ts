import { describe, expect, it } from 'vitest';
import { createDailyReflection } from './DailyReflection';
import { createGrowthEvent } from './GrowthEvent';
import { createJournalEntry } from './JournalEntry';
import { buildJournalTimeline, formatJournalTimelineStatus } from './JournalTimeline';
import { createTradeReview } from './TradeReview';

describe('JournalTimeline', () => {
  it('handles empty timeline state', () => {
    const timeline = buildJournalTimeline({});

    expect(timeline).toEqual({
      entries: [],
      empty: true,
    });
    expect(formatJournalTimelineStatus(timeline)).toBe('No journal timeline entries');
  });

  it('builds a single read-only timeline entry', () => {
    const entry = createJournalEntry(
      {
        content: 'Protected capital.',
        entryDate: '2026-06-29',
      },
      {
        id: 'journal-001',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    if (entry === undefined) throw new Error('Expected journal entry');

    const timeline = buildJournalTimeline({ journalEntries: [entry] });

    expect(timeline.entries).toEqual([
      {
        id: 'journal_entry:journal-001',
        sourceId: 'journal-001',
        type: 'journal_entry',
        occurredAt: '2026-06-29',
        title: 'Journal entry',
      },
    ]);
    expect(timeline.empty).toBe(false);
    expect(formatJournalTimelineStatus(timeline)).toBe('1 journal timeline entry');
  });

  it('orders mixed journal evidence chronologically', () => {
    const journalEntry = createJournalEntry(
      {
        content: 'Journal evidence.',
        entryDate: '2026-06-29',
      },
      {
        id: 'journal-001',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    const reflection = createDailyReflection(
      {
        reflectionDate: '2026-06-27',
        behaviorSummary: 'Paused before acting.',
        emotionalState: 'Stable.',
        disciplineObservation: 'Followed plan.',
      },
      {
        id: 'reflection-001',
        now: '2026-06-27T20:00:00.000Z',
      },
    );
    const tradeReview = createTradeReview(
      {
        tradeId: 'trade-001',
        reviewDate: '2026-06-28',
        followedPlan: true,
        emotionalState: 'Calm.',
        whatWentWell: 'Waited.',
        whatToImprove: 'Refine exit.',
        lessonsLearned: 'Plan exits.',
        wouldTakeAgain: true,
      },
      {
        id: 'trade-review-001',
        now: '2026-06-28T20:00:00.000Z',
      },
    );
    const growthEvent = createGrowthEvent(
      {
        eventDate: '2026-06-30',
        title: 'Patience recognized',
        description: 'Waited for confirmation.',
        category: 'patience',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
      },
      {
        id: 'growth-001',
        now: '2026-06-30T20:00:00.000Z',
      },
    );
    if (journalEntry === undefined || reflection === undefined || tradeReview === undefined || growthEvent === undefined) {
      throw new Error('Expected journal timeline fixtures');
    }

    const timeline = buildJournalTimeline({
      journalEntries: [journalEntry],
      dailyReflections: [reflection],
      tradeReviews: [tradeReview],
      growthEvents: [growthEvent],
    });

    expect(timeline.entries.map((entry) => entry.type)).toEqual([
      'daily_reflection',
      'trade_review',
      'journal_entry',
      'growth_event',
    ]);
    expect(formatJournalTimelineStatus(timeline)).toBe('4 journal timeline entries');
  });

  it('uses deterministic ordering when entries share the same date', () => {
    const journalEntry = createJournalEntry(
      {
        content: 'Journal evidence.',
        entryDate: '2026-06-29',
      },
      {
        id: 'journal-b',
        now: '2026-06-29T20:00:00.000Z',
      },
    );
    const growthEvent = createGrowthEvent(
      {
        eventDate: '2026-06-29',
        title: 'Discipline recognized',
        description: 'Stayed with the plan.',
        category: 'discipline',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-b',
        },
      },
      {
        id: 'growth-a',
        now: '2026-06-29T21:00:00.000Z',
      },
    );
    if (journalEntry === undefined || growthEvent === undefined) {
      throw new Error('Expected journal timeline fixtures');
    }

    const timeline = buildJournalTimeline({
      growthEvents: [growthEvent],
      journalEntries: [journalEntry],
    });

    expect(timeline.entries.map((entry) => entry.id)).toEqual([
      'growth_event:growth-a',
      'journal_entry:journal-b',
    ]);
  });
});
