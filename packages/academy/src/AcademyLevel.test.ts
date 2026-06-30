import { describe, expect, it } from 'vitest';
import { resolveAcademyLevel } from './AcademyLevel';

describe('Academy level system', () => {
  it('starts empty and negative XP at the foundation level', () => {
    expect(resolveAcademyLevel(0)).toEqual({
      level: 1,
      title: 'Foundation',
      totalXp: 0,
      minimumXp: 0,
      nextLevelXp: 100,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
    });

    expect(resolveAcademyLevel(-25).totalXp).toBe(0);
  });

  it('resolves exact threshold boundaries deterministically', () => {
    expect(resolveAcademyLevel(100)).toEqual({
      level: 2,
      title: 'Discipline',
      totalXp: 100,
      minimumXp: 100,
      nextLevelXp: 250,
      xpIntoLevel: 0,
      xpToNextLevel: 150,
    });

    expect(resolveAcademyLevel(250).level).toBe(3);
    expect(resolveAcademyLevel(500).level).toBe(4);
  });

  it('tracks progress toward the next level without social mechanics', () => {
    expect(resolveAcademyLevel(175)).toEqual({
      level: 2,
      title: 'Discipline',
      totalXp: 175,
      minimumXp: 100,
      nextLevelXp: 250,
      xpIntoLevel: 75,
      xpToNextLevel: 75,
    });
  });

  it('handles final-level XP safely', () => {
    expect(resolveAcademyLevel(1200)).toEqual({
      level: 5,
      title: 'Command Readiness',
      totalXp: 1200,
      minimumXp: 900,
      nextLevelXp: null,
      xpIntoLevel: 300,
      xpToNextLevel: null,
    });
  });

  it('normalizes fractional and non-finite XP deterministically', () => {
    expect(resolveAcademyLevel(99.9).totalXp).toBe(99);
    expect(resolveAcademyLevel(Number.NaN).totalXp).toBe(0);
    expect(resolveAcademyLevel(Number.POSITIVE_INFINITY).totalXp).toBe(0);
  });
});
