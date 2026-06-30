import type { GrowthEventCategory } from '@headquarters/journal';
import type { AcademyGrowthEvent } from './AcademyGrowthEvent';

export interface AcademyConsistency {
  readonly totalGrowthEvents: number;
  readonly activeDays: number;
  readonly longestDailyStreak: number;
  readonly repeatedBehaviorCategories: readonly GrowthEventCategory[];
  readonly hasConsistentEvidence: boolean;
  readonly ignoredEventsWithoutDate: number;
}

const DAY_IN_MS = 86_400_000;
const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export function buildAcademyConsistency(events: readonly AcademyGrowthEvent[]): AcademyConsistency {
  const validDays = events
    .map((event) => parseIsoDay(event.occurredOn))
    .filter((day): day is string => day !== undefined);
  const uniqueDays = [...new Set(validDays)].sort();
  const repeatedBehaviorCategories = findRepeatedBehaviorCategories(events);

  return {
    totalGrowthEvents: events.length,
    activeDays: uniqueDays.length,
    longestDailyStreak: calculateLongestDailyStreak(uniqueDays),
    repeatedBehaviorCategories,
    hasConsistentEvidence: uniqueDays.length >= 2 || repeatedBehaviorCategories.length > 0,
    ignoredEventsWithoutDate: events.length - validDays.length,
  };
}

function parseIsoDay(value: string): string | undefined {
  const day = value.trim();
  return ISO_DAY_PATTERN.test(day) ? day : undefined;
}

function findRepeatedBehaviorCategories(events: readonly AcademyGrowthEvent[]): readonly GrowthEventCategory[] {
  const counts = new Map<GrowthEventCategory, number>();

  for (const event of events) {
    counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([category]) => category)
    .sort();
}

function calculateLongestDailyStreak(sortedUniqueDays: readonly string[]): number {
  if (sortedUniqueDays.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;
  let previousDay = sortedUniqueDays[0];

  for (let index = 1; index < sortedUniqueDays.length; index += 1) {
    const currentDay = sortedUniqueDays[index];
    if (currentDay === undefined || previousDay === undefined) continue;

    if (daysBetween(previousDay, currentDay) === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    previousDay = currentDay;
  }

  return longestStreak;
}

function daysBetween(previousDay: string, currentDay: string): number {
  const previousTime = Date.parse(`${previousDay}T00:00:00.000Z`);
  const currentTime = Date.parse(`${currentDay}T00:00:00.000Z`);

  if (!Number.isFinite(previousTime) || !Number.isFinite(currentTime)) return 0;

  return Math.round((currentTime - previousTime) / DAY_IN_MS);
}
