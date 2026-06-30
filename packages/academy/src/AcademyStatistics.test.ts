import { describe, expect, it } from 'vitest';
import { buildAcademyStatistics } from './AcademyStatistics';
import type { AcademyGrowthEvent } from './AcademyGrowthEvent';

describe('Academy statistics', () => {
  it('returns deterministic empty statistics', () => {
    expect(buildAcademyStatistics([])).toEqual({
      totalGrowthEvents: 0,
      totalXp: 0,
      level: {
        level: 1,
        title: 'Foundation',
        totalXp: 0,
        minimumXp: 0,
        nextLevelXp: 100,
        xpIntoLevel: 0,
        xpToNextLevel: 100,
      },
      recognitionCount: 0,
      categoryCounts: {
        discipline: 0,
        patience: 0,
        risk_awareness: 0,
        emotional_regulation: 0,
        process_improvement: 0,
      },
      evidenceSourceCounts: {
        journal_growth_event: 0,
        mission_debrief: 0,
      },
      hasGrowthEvidence: false,
    });
  });

  it('aggregates behavior-focused statistics from approved Academy inputs', () => {
    const statistics = buildAcademyStatistics([
      createJournalEvent('growth-001', 'discipline'),
      createJournalEvent('growth-002', 'discipline'),
      createJournalEvent('growth-003', 'discipline'),
      createMissionEvent('growth-004', 'patience'),
      createMissionEvent('growth-005', 'risk_awareness'),
    ]);

    expect(statistics.totalGrowthEvents).toBe(5);
    expect(statistics.totalXp).toBe(71);
    expect(statistics.level.level).toBe(1);
    expect(statistics.recognitionCount).toBe(2);
    expect(statistics.categoryCounts).toEqual({
      discipline: 3,
      patience: 1,
      risk_awareness: 1,
      emotional_regulation: 0,
      process_improvement: 0,
    });
    expect(statistics.evidenceSourceCounts).toEqual({
      journal_growth_event: 3,
      mission_debrief: 2,
    });
    expect(statistics.hasGrowthEvidence).toBe(true);
  });

  it('does not expose financial outcome ranking fields', () => {
    const statistics = buildAcademyStatistics([createJournalEvent('growth-001', 'process_improvement')]);

    expect(statistics).not.toHaveProperty('profit');
    expect(statistics).not.toHaveProperty('pnl');
    expect(statistics).not.toHaveProperty('winRate');
  });
});

function createJournalEvent(
  id: string,
  category: AcademyGrowthEvent['category'],
): AcademyGrowthEvent {
  return {
    id,
    occurredOn: '2026-06-30',
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

function createMissionEvent(
  id: string,
  category: AcademyGrowthEvent['category'],
): AcademyGrowthEvent {
  return {
    id,
    occurredOn: '2026-06-30',
    title: `Mission growth event ${id}`,
    description: 'Approved mission debrief evidence.',
    category,
    evidence: {
      sourceType: 'mission_debrief',
      missionId: `mission-${id}`,
      debriefId: `debrief-${id}`,
    },
    createdAt: '2026-06-30T00:00:00.000Z',
  };
}
