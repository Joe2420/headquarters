export interface AcademyLevelDefinition {
  readonly level: number;
  readonly title: string;
  readonly minimumXp: number;
}

export interface AcademyLevelProgress {
  readonly level: number;
  readonly title: string;
  readonly totalXp: number;
  readonly minimumXp: number;
  readonly nextLevelXp: number | null;
  readonly xpIntoLevel: number;
  readonly xpToNextLevel: number | null;
}

const FOUNDATION_LEVEL: AcademyLevelDefinition = { level: 1, title: 'Foundation', minimumXp: 0 };

export const ACADEMY_LEVELS: readonly AcademyLevelDefinition[] = [
  FOUNDATION_LEVEL,
  { level: 2, title: 'Discipline', minimumXp: 100 },
  { level: 3, title: 'Consistency', minimumXp: 250 },
  { level: 4, title: 'Judgment', minimumXp: 500 },
  { level: 5, title: 'Command Readiness', minimumXp: 900 },
];

export function resolveAcademyLevel(totalXp: number): AcademyLevelProgress {
  const normalizedXp = normalizeXp(totalXp);
  const currentLevel = findCurrentLevel(normalizedXp);
  const nextLevel = ACADEMY_LEVELS.find((level) => level.minimumXp > currentLevel.minimumXp);
  const nextLevelXp = nextLevel?.minimumXp ?? null;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    totalXp: normalizedXp,
    minimumXp: currentLevel.minimumXp,
    nextLevelXp,
    xpIntoLevel: normalizedXp - currentLevel.minimumXp,
    xpToNextLevel: nextLevelXp === null ? null : nextLevelXp - normalizedXp,
  };
}

function normalizeXp(totalXp: number): number {
  if (!Number.isFinite(totalXp)) return 0;
  return Math.max(0, Math.floor(totalXp));
}

function findCurrentLevel(totalXp: number): AcademyLevelDefinition {
  let currentLevel = FOUNDATION_LEVEL;

  for (const level of ACADEMY_LEVELS) {
    if (totalXp >= level.minimumXp) {
      currentLevel = level;
    }
  }

  return currentLevel;
}
