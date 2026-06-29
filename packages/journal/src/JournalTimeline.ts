import type { DailyReflection } from './DailyReflection';
import type { GrowthEvent } from './GrowthEvent';
import type { JournalEntry } from './JournalEntry';
import type { TradeReview } from './TradeReview';

export type JournalTimelineEntryType = 'journal_entry' | 'daily_reflection' | 'trade_review' | 'growth_event';

export interface JournalTimelineInput {
  readonly journalEntries?: readonly JournalEntry[];
  readonly dailyReflections?: readonly DailyReflection[];
  readonly tradeReviews?: readonly TradeReview[];
  readonly growthEvents?: readonly GrowthEvent[];
}

export interface JournalTimelineEntry {
  readonly id: string;
  readonly sourceId: string;
  readonly type: JournalTimelineEntryType;
  readonly occurredAt: string;
  readonly title: string;
}

export interface JournalTimeline {
  readonly entries: readonly JournalTimelineEntry[];
  readonly empty: boolean;
}

export function buildJournalTimeline(input: JournalTimelineInput): JournalTimeline {
  const entries = [
    ...(input.journalEntries ?? []).map(toJournalEntryTimelineEntry),
    ...(input.dailyReflections ?? []).map(toDailyReflectionTimelineEntry),
    ...(input.tradeReviews ?? []).map(toTradeReviewTimelineEntry),
    ...(input.growthEvents ?? []).map(toGrowthEventTimelineEntry),
  ];

  const orderedEntries = entries.sort(compareJournalTimelineEntries);

  return {
    entries: orderedEntries,
    empty: orderedEntries.length === 0,
  };
}

export function formatJournalTimelineStatus(timeline: JournalTimeline): string {
  if (timeline.entries.length === 0) return 'No journal timeline entries';
  if (timeline.entries.length === 1) return '1 journal timeline entry';
  return `${timeline.entries.length} journal timeline entries`;
}

function toJournalEntryTimelineEntry(entry: JournalEntry): JournalTimelineEntry {
  return {
    id: `journal_entry:${entry.id}`,
    sourceId: entry.id,
    type: 'journal_entry',
    occurredAt: entry.entryDate,
    title: 'Journal entry',
  };
}

function toDailyReflectionTimelineEntry(reflection: DailyReflection): JournalTimelineEntry {
  return {
    id: `daily_reflection:${reflection.id}`,
    sourceId: reflection.id,
    type: 'daily_reflection',
    occurredAt: reflection.reflectionDate,
    title: 'Daily reflection',
  };
}

function toTradeReviewTimelineEntry(review: TradeReview): JournalTimelineEntry {
  return {
    id: `trade_review:${review.id}`,
    sourceId: review.id,
    type: 'trade_review',
    occurredAt: review.reviewDate,
    title: 'Trade review',
  };
}

function toGrowthEventTimelineEntry(event: GrowthEvent): JournalTimelineEntry {
  return {
    id: `growth_event:${event.id}`,
    sourceId: event.id,
    type: 'growth_event',
    occurredAt: event.eventDate,
    title: event.title,
  };
}

function compareJournalTimelineEntries(left: JournalTimelineEntry, right: JournalTimelineEntry): number {
  const dateComparison = left.occurredAt.localeCompare(right.occurredAt);
  if (dateComparison !== 0) return dateComparison;

  const typeComparison = left.type.localeCompare(right.type);
  if (typeComparison !== 0) return typeComparison;

  return left.sourceId.localeCompare(right.sourceId);
}
