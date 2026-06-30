import { describe, expect, it } from 'vitest';
import type { AcademyGrowthEvent } from './AcademyGrowthEvent';
import { buildAcademyConsistency } from './AcademyConsistency';
import { resolveAcademyLevel } from './AcademyLevel';
import { buildAcademyRecognitions } from './AcademyRecognition';
import { buildAcademyStatistics } from './AcademyStatistics';
import { calculateAcademyXp } from './AcademyXpEngine';

describe('Sprint 7 Academy review', () => {
  it('composes Academy growth mechanics from behavior evidence without profit or Guardian dependencies', () => {
    const events: AcademyGrowthEvent[] = [
      createAcademyEvent('growth-001', 'discipline', '2026-06-27'),
      createAcademyEvent('growth-002', 'patience', '2026-06-28'),
      createAcademyEvent('growth-003', 'discipline', '2026-06-29'),
      createAcademyEvent('growth-004', 'process_improvement', '2026-06-30'),
      createAcademyEvent('growth-005', 'discipline', '2026-07-01'),
    ];

    const xp = calculateAcademyXp(events);
    const level = resolveAcademyLevel(xp.totalXp);
    const recognitions = buildAcademyRecognitions(events);
    const statistics = buildAcademyStatistics(events);
    const consistency = buildAcademyConsistency(events);

    expect(xp.totalXp).toBe(67);
    expect(xp.awards.every((award) => award.evidence.sourceType === 'journal_growth_event')).toBe(true);
    expect(level.title).toBe('Foundation');
    expect(recognitions.map((recognition) => recognition.type)).toContain('category_milestone');
    expect(recognitions.map((recognition) => recognition.type)).toContain('quiet_consistency');
    expect(statistics.categoryCounts.discipline).toBe(3);
    expect(statistics.evidenceSourceCounts.journal_growth_event).toBe(5);
    expect(consistency.activeDays).toBe(5);
    expect(consistency.longestDailyStreak).toBe(5);
    expect(consistency.repeatedBehaviorCategories).toEqual(['discipline']);
  });
});

function createAcademyEvent(
  id: string,
  category: AcademyGrowthEvent['category'],
  occurredAt: string,
): AcademyGrowthEvent {
  return {
    id,
    title: `Growth ${id}`,
    description: 'Behavior-focused growth evidence.',
    category,
    occurredOn: occurredAt,
    evidence: {
      sourceType: 'journal_growth_event',
      growthEventId: id,
      journalSourceType: 'journal_entry',
      journalSourceId: `journal-${id}`,
    },
    createdAt: `${occurredAt}T00:00:00.000Z`,
  };
}
