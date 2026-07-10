import type { CommanderBehaviorProfile } from './CommanderBehaviorProfile';

export interface CommanderLearningVisibility {
  readonly status: 'empty' | 'learning';
  readonly missionCount: number;
  readonly headline: string;
  readonly strengths: readonly string[];
  readonly coachingFocus: string;
}

export function buildCommanderLearningVisibility(profile: CommanderBehaviorProfile | undefined): CommanderLearningVisibility {
  if (profile === undefined || profile.missionCount === 0) {
    return {
      status: 'empty',
      missionCount: 0,
      headline: 'Commander has no behavior history yet.',
      strengths: [],
      coachingFocus: 'No coaching focus yet',
    };
  }

  const strengths = profile.traits
    .filter((trait) => trait.score > 0 && trait.trait !== 'impulsiveness' && trait.trait !== 'hesitation')
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((trait) => `${formatLearningTrait(trait.trait)}: ${trait.level}`);

  return {
    status: 'learning',
    missionCount: profile.missionCount,
    headline: `Commander is learning from ${profile.missionCount} mission${profile.missionCount === 1 ? '' : 's'}.`,
    strengths,
    coachingFocus: profile.coachingFocus ? formatLearningTrait(profile.coachingFocus) : 'No coaching focus yet',
  };
}

function formatLearningTrait(trait: string): string {
  return trait
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (first) => first.toUpperCase());
}
