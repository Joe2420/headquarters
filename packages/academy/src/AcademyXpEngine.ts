import type { GrowthEvent, GrowthEventCategory } from '@headquarters/journal';
import type { UUID } from '@headquarters/shared';

export interface AcademyXpAward {
  readonly growthEventId: UUID;
  readonly category: GrowthEventCategory;
  readonly xp: number;
  readonly reason: string;
  readonly evidence: GrowthEvent['evidence'];
}

export interface AcademyXpSummary {
  readonly totalXp: number;
  readonly awards: readonly AcademyXpAward[];
}

const CATEGORY_XP: Readonly<Record<GrowthEventCategory, number>> = {
  discipline: 15,
  patience: 12,
  risk_awareness: 14,
  emotional_regulation: 13,
  process_improvement: 10,
};

const CATEGORY_REASONS: Readonly<Record<GrowthEventCategory, string>> = {
  discipline: 'Disciplined process behavior',
  patience: 'Patience and restraint behavior',
  risk_awareness: 'Risk-aware decision behavior',
  emotional_regulation: 'Emotional regulation behavior',
  process_improvement: 'Process improvement behavior',
};

export function calculateAcademyXp(events: readonly GrowthEvent[]): AcademyXpSummary {
  const awards = events.map(createXpAward);

  return {
    totalXp: awards.reduce((total, award) => total + award.xp, 0),
    awards,
  };
}

export function getAcademyXpForCategory(category: GrowthEventCategory): number {
  return CATEGORY_XP[category];
}

function createXpAward(event: GrowthEvent): AcademyXpAward {
  return {
    growthEventId: event.id,
    category: event.category,
    xp: CATEGORY_XP[event.category],
    reason: CATEGORY_REASONS[event.category],
    evidence: event.evidence,
  };
}
