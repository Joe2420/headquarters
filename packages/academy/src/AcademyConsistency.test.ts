import { describe, expect, it } from 'vitest';
import { buildAcademyConsistency } from './AcademyConsistency';
import type { AcademyGrowthEvent } from './AcademyGrowthEvent';

describe('Academy consistency', () => {
  it('returns safe empty consistency metrics', () => {
    expect(buildAcademyConsistency([])).toEqual({
      totalGrowthEvents: 0,
      activeDays: 0,
      longestDailyStreak: 0,
      repeatedBehaviorCategories: [],
      hasConsistentEvidence: false,
      ignoredEventsWithoutDate: 0,
    });
  });

  it('tracks repeat behavior and daily consistency deterministically', () => {
    expect(buildAcademyConsistency([
      createEvent('growth-001', '2026-06-28', 'discipline'),
      createEvent('growth-002', '2026-06-29', 'discipline'),
      createEvent('growth-003', '2026-06-30', 'patience'),
      createEvent('growth-004', '2026-07-02', 'patience'),
    ])).toEqual({
      totalGrowthEvents: 4,
      activeDays: 4,
      longestDailyStreak: 3,
      repeatedBehaviorCategories: ['discipline', 'patience'],
      hasConsistentEvidence: true,
      ignoredEventsWithoutDate: 0,
    });
  });

  it('handles duplicate days and missing date data safely', () => {
    expect(buildAcademyConsistency([
      createEvent('growth-001', '2026-06-28', 'discipline'),
      createEvent('growth-002', '2026-06-28', 'discipline'),
      createEvent('growth-003', '', 'risk_awareness'),
      createEvent('growth-004', 'not-a-date', 'risk_awareness'),
    ])).toEqual({
      totalGrowthEvents: 4,
      activeDays: 1,
      longestDailyStreak: 1,
      repeatedBehaviorCategories: ['discipline', 'risk_awareness'],
      hasConsistentEvidence: true,
      ignoredEventsWithoutDate: 2,
    });
  });
});

function createEvent(
  id: string,
  occurredOn: string,
  category: AcademyGrowthEvent['category'],
): AcademyGrowthEvent {
  return {
    id,
    occurredOn,
    title: `Growth event ${id}`,
    description: 'Approved growth evidence.',
    category,
    evidence: {
      sourceType: 'journal_growth_event',
      growthEventId: id,
      journalSourceType: 'journal_entry',
      journalSourceId: `journal-${id}`,
    },
    createdAt: '2026-06-30T00:00:00.000Z',
  };
}
