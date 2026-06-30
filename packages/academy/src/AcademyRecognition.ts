import type { GrowthEventCategory } from '@headquarters/journal';
import type { UUID } from '@headquarters/shared';
import type { AcademyGrowthEvent } from './AcademyGrowthEvent';

export type AcademyRecognitionType = 'category_milestone' | 'quiet_consistency';

export interface AcademyRecognition {
  readonly id: string;
  readonly type: AcademyRecognitionType;
  readonly title: string;
  readonly description: string;
  readonly sourceEventIds: readonly UUID[];
}

const CATEGORY_MILESTONE_COUNT = 3;
const QUIET_CONSISTENCY_COUNT = 5;

const CATEGORY_LABELS: Readonly<Record<GrowthEventCategory, string>> = {
  discipline: 'Discipline',
  patience: 'Patience',
  risk_awareness: 'Risk awareness',
  emotional_regulation: 'Emotional regulation',
  process_improvement: 'Process improvement',
};

export function buildAcademyRecognitions(events: readonly AcademyGrowthEvent[]): readonly AcademyRecognition[] {
  return [
    ...buildCategoryMilestones(events),
    ...buildQuietConsistencyRecognition(events),
  ];
}

function buildCategoryMilestones(events: readonly AcademyGrowthEvent[]): AcademyRecognition[] {
  const eventsByCategory = groupEventsByCategory(events);
  const recognitions: AcademyRecognition[] = [];

  for (const [category, categoryEvents] of eventsByCategory.entries()) {
    if (categoryEvents.length < CATEGORY_MILESTONE_COUNT) continue;

    const sourceEventIds = categoryEvents
      .slice(0, CATEGORY_MILESTONE_COUNT)
      .map((event) => event.id);
    const label = CATEGORY_LABELS[category];

    recognitions.push({
      id: `recognition:${category}:${CATEGORY_MILESTONE_COUNT}`,
      type: 'category_milestone',
      title: `${label} milestone noted`,
      description: `${label} has appeared repeatedly in approved growth evidence.`,
      sourceEventIds,
    });
  }

  return recognitions;
}

function buildQuietConsistencyRecognition(events: readonly AcademyGrowthEvent[]): AcademyRecognition[] {
  if (events.length < QUIET_CONSISTENCY_COUNT) return [];

  return [{
    id: `recognition:quiet-consistency:${QUIET_CONSISTENCY_COUNT}`,
    type: 'quiet_consistency',
    title: 'Quiet consistency noted',
    description: 'Approved growth evidence shows repeated professional behavior.',
    sourceEventIds: events.slice(0, QUIET_CONSISTENCY_COUNT).map((event) => event.id),
  }];
}

function groupEventsByCategory(
  events: readonly AcademyGrowthEvent[],
): Map<GrowthEventCategory, AcademyGrowthEvent[]> {
  const eventsByCategory = new Map<GrowthEventCategory, AcademyGrowthEvent[]>();

  for (const event of events) {
    const categoryEvents = eventsByCategory.get(event.category) ?? [];
    categoryEvents.push(event);
    eventsByCategory.set(event.category, categoryEvents);
  }

  return eventsByCategory;
}
