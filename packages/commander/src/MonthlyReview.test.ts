import { describe, expect, it } from 'vitest';
import { buildCommanderMonthlyReview } from './MonthlyReview';

describe('buildCommanderMonthlyReview', () => {
  it('preserves traceable monthly evidence links', () => {
    const review = buildCommanderMonthlyReview({
      missionCount: 3,
      journalEntryCount: 5,
      doctrineRecordCount: 2,
      academyGrowthEventCount: 4,
      generatedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(review.summary).toBe('Monthly review is assembled from traceable Headquarters records.');
    expect(review.empty).toBe(false);
    expect(review.evidenceLinks).toEqual([
      { source: 'mission', label: 'Mission records', count: 3 },
      { source: 'journal', label: 'Journal entries', count: 5 },
      { source: 'doctrine', label: 'Doctrine records', count: 2 },
      { source: 'academy', label: 'Academy growth events', count: 4 },
    ]);
    expect(review.institutionalNote).toContain('institutional');
    expect(review.institutionalNote).toContain('non-predictive');
  });

  it('handles an empty monthly review state safely', () => {
    const review = buildCommanderMonthlyReview({
      missionCount: 0,
      journalEntryCount: 0,
      doctrineRecordCount: 0,
      academyGrowthEventCount: 0,
      generatedAt: 'standby',
    });

    expect(review.summary).toBe('No traceable monthly evidence is available yet.');
    expect(review.empty).toBe(true);
    expect(review.evidenceLinks.every((link) => link.count === 0)).toBe(true);
  });
});
