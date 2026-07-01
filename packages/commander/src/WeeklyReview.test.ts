import { describe, expect, it } from 'vitest';
import { buildCommanderWeeklyReview } from './WeeklyReview';

describe('buildCommanderWeeklyReview', () => {
  it('summarizes approved weekly evidence deterministically', () => {
    const review = buildCommanderWeeklyReview({
      missionCount: 2,
      journalEntryCount: 3,
      doctrineRecordCount: 1,
      academyGrowthEventCount: 4,
      generatedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(review).toMatchObject({
      title: 'Weekly Review',
      generatedAt: '2026-07-01T00:00:00.000Z',
      summary: 'Weekly review is ready from approved Headquarters evidence.',
      empty: false,
    });
    expect(review.evidence).toEqual([
      '2 mission records',
      '3 journal entries',
      '1 doctrine record',
      '4 Academy growth events',
    ]);
    expect(review.constraints).toContain('No market prediction.');
  });

  it('handles an empty weekly review state safely', () => {
    const review = buildCommanderWeeklyReview({
      missionCount: 0,
      journalEntryCount: 0,
      doctrineRecordCount: 0,
      academyGrowthEventCount: 0,
      generatedAt: 'standby',
    });

    expect(review.summary).toBe('No approved weekly evidence is available yet.');
    expect(review.empty).toBe(true);
    expect(review.evidence).toEqual([
      '0 mission records',
      '0 journal entries',
      '0 doctrine records',
      '0 Academy growth events',
    ]);
  });
});
