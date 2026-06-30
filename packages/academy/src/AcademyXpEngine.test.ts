import { describe, expect, it } from 'vitest';
import type { GrowthEvent } from '@headquarters/journal';
import {
  calculateAcademyXp,
  getAcademyXpForCategory,
} from './AcademyXpEngine';

describe('Academy XP engine', () => {
  it('calculates deterministic XP from approved growth event inputs', () => {
    const summary = calculateAcademyXp([
      createGrowthEvent('growth-001', 'discipline'),
      createGrowthEvent('growth-002', 'patience'),
      createGrowthEvent('growth-003', 'risk_awareness'),
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
            sourceType: 'journal_entry',
            sourceId: 'journal-growth-001',
          },
        },
        {
          growthEventId: 'growth-002',
          category: 'patience',
          xp: 12,
          reason: 'Patience and restraint behavior',
          evidence: {
            sourceType: 'journal_entry',
            sourceId: 'journal-growth-002',
          },
        },
        {
          growthEventId: 'growth-003',
          category: 'risk_awareness',
          xp: 14,
          reason: 'Risk-aware decision behavior',
          evidence: {
            sourceType: 'journal_entry',
            sourceId: 'journal-growth-003',
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

    const summary = calculateAcademyXp([growthEvent]);

    expect(summary.totalXp).toBe(getAcademyXpForCategory('process_improvement'));
    expect(summary.awards[0]).not.toHaveProperty('profit');
    expect(summary.awards[0]).not.toHaveProperty('pnl');
    expect(summary.awards[0]).not.toHaveProperty('returnAmount');
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
