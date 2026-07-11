import { describe, expect, it } from 'vitest';

import { buildCommanderLearningVisibility } from './CommanderLearningVisibility';

describe('CommanderLearningVisibility', () => {
  it('reports an empty learning state before mission evidence exists', () => {
    expect(buildCommanderLearningVisibility(undefined)).toEqual({
      status: 'empty',
      missionCount: 0,
      headline: 'Commander has no behavior history yet.',
      strengths: [],
      coachingFocus: 'No coaching focus yet',
    });
  });

  it('summarizes visible Commander learning without mutating the profile', () => {
    const profile = {
      missionCount: 2,
      traits: [
        { trait: 'patience' as const, score: 75, level: 'strong' as const, evidence: [] },
        { trait: 'preparationQuality' as const, score: 50, level: 'stable' as const, evidence: [] },
        { trait: 'impulsiveness' as const, score: 25, level: 'forming' as const, evidence: [] },
      ],
      warnings: [],
      reinforcements: [],
      coachingFocus: 'impulsiveness' as const,
    };

    expect(buildCommanderLearningVisibility(profile)).toEqual({
      status: 'learning',
      missionCount: 2,
      headline: 'Commander is learning from 2 missions.',
      strengths: ['Patience: strong', 'Preparation Quality: stable'],
      coachingFocus: 'Impulsiveness',
    });
  });
});
