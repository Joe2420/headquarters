import { describe, expect, it } from 'vitest';
import type { GrowthEvent } from '@headquarters/journal';
import {
  createAcademyGrowthEventFromJournal,
  createAcademyGrowthEventFromMissionDebrief,
  isAcademyGrowthEventTraceable,
} from './AcademyGrowthEvent';
import {
  calculateAcademyXp,
  calculateAcademyXpFromJournalGrowthEvents,
  getAcademyXpForCategory,
} from './AcademyXpEngine';

describe('Academy XP engine', () => {
  it('calculates deterministic XP from approved growth event inputs', () => {
    const summary = calculateAcademyXp([
      createAcademyGrowthEventFromJournal(createGrowthEvent('growth-001', 'discipline')),
      createAcademyGrowthEventFromJournal(createGrowthEvent('growth-002', 'patience')),
      createAcademyGrowthEventFromJournal(createGrowthEvent('growth-003', 'risk_awareness')),
    ]);

    expect(summary).toEqual({
      totalXp: 41,
      awards: [
        {
          growthEventId: 'growth-001',
          category: 'discipline',
          xp: 15,
          reason: 'Disciplined process behavior',
          evidence: {
            sourceType: 'journal_growth_event',
            growthEventId: 'growth-001',
            journalSourceType: 'journal_entry',
            journalSourceId: 'journal-growth-001',
          },
        },
        {
          growthEventId: 'growth-002',
          category: 'patience',
          xp: 12,
          reason: 'Patience and restraint behavior',
          evidence: {
            sourceType: 'journal_growth_event',
            growthEventId: 'growth-002',
            journalSourceType: 'journal_entry',
            journalSourceId: 'journal-growth-002',
          },
        },
        {
          growthEventId: 'growth-003',
          category: 'risk_awareness',
          xp: 14,
          reason: 'Risk-aware decision behavior',
          evidence: {
            sourceType: 'journal_growth_event',
            growthEventId: 'growth-003',
            journalSourceType: 'journal_entry',
            journalSourceId: 'journal-growth-003',
          },
        },
      ],
    });
  });

  it('handles an empty event set without awarding XP', () => {
    expect(calculateAcademyXp([])).toEqual({
      totalXp: 0,
      awards: [],
    });
  });

  it('keeps XP tied to behavior categories rather than financial outcome', () => {
    const growthEvent = {
      ...createGrowthEvent('growth-004', 'process_improvement'),
      profit: 9000,
      pnl: 9000,
      returnAmount: 9000,
    };

    const summary = calculateAcademyXpFromJournalGrowthEvents([growthEvent]);

    expect(summary.totalXp).toBe(getAcademyXpForCategory('process_improvement'));
    expect(summary.awards[0]).not.toHaveProperty('profit');
    expect(summary.awards[0]).not.toHaveProperty('pnl');
    expect(summary.awards[0]).not.toHaveProperty('returnAmount');
  });
});

describe('Academy growth event evidence', () => {
  it('normalizes journal growth events without taking Journal ownership', () => {
    const event = createAcademyGrowthEventFromJournal(createGrowthEvent('growth-005', 'emotional_regulation'));

    expect(event).toEqual({
      id: 'growth-005',
      occurredOn: '2026-06-29',
      title: 'Growth event growth-005',
      description: 'Behavioral growth evidence.',
      category: 'emotional_regulation',
      evidence: {
        sourceType: 'journal_growth_event',
        growthEventId: 'growth-005',
        journalSourceType: 'journal_entry',
        journalSourceId: 'journal-growth-005',
      },
      createdAt: '2026-06-29T00:00:00.000Z',
    });
    expect(isAcademyGrowthEventTraceable(event)).toBe(true);
  });

  it('supports typed mission debrief evidence without persistence behavior', () => {
    const event = createAcademyGrowthEventFromMissionDebrief({
      id: 'academy-growth-001',
      occurredOn: '2026-06-30',
      title: 'Debrief completed',
      description: 'Completed debrief with clear process improvement.',
      category: 'process_improvement',
      missionId: 'mission-001',
      debriefId: 'debrief-001',
      createdAt: '2026-06-30T00:00:00.000Z',
    });

    expect(event?.evidence).toEqual({
      sourceType: 'mission_debrief',
      missionId: 'mission-001',
      debriefId: 'debrief-001',
    });
    expect(event && isAcademyGrowthEventTraceable(event)).toBe(true);
  });

  it('rejects mission debrief growth events without traceable evidence', () => {
    expect(createAcademyGrowthEventFromMissionDebrief({
      id: 'academy-growth-002',
      occurredOn: '2026-06-30',
      title: 'Debrief completed',
      description: 'Missing debrief evidence.',
      category: 'process_improvement',
      missionId: 'mission-001',
      debriefId: '',
      createdAt: '2026-06-30T00:00:00.000Z',
    })).toBeUndefined();
  });
});

function createGrowthEvent(
  id: string,
  category: GrowthEvent['category'],
): GrowthEvent {
  return {
    id,
    eventDate: '2026-06-29',
    title: `Growth event ${id}`,
    description: 'Behavioral growth evidence.',
    category,
    evidence: {
      sourceType: 'journal_entry',
      sourceId: `journal-${id}`,
    },
    rewardStatus: 'not_awarded',
    createdAt: '2026-06-29T00:00:00.000Z',
  };
}
