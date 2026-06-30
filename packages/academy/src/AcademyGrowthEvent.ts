import type { GrowthEvent, GrowthEventCategory, GrowthEventSourceType } from '@headquarters/journal';
import type { ISODateTime, UUID } from '@headquarters/shared';

export type AcademyGrowthEventEvidence =
  | AcademyJournalGrowthEventEvidence
  | AcademyMissionDebriefEvidence;

export interface AcademyJournalGrowthEventEvidence {
  readonly sourceType: 'journal_growth_event';
  readonly growthEventId: UUID;
  readonly journalSourceType: GrowthEventSourceType;
  readonly journalSourceId: UUID;
}

export interface AcademyMissionDebriefEvidence {
  readonly sourceType: 'mission_debrief';
  readonly missionId: UUID;
  readonly debriefId: UUID;
}

export interface AcademyGrowthEvent {
  readonly id: UUID;
  readonly occurredOn: string;
  readonly title: string;
  readonly description: string;
  readonly category: GrowthEventCategory;
  readonly evidence: AcademyGrowthEventEvidence;
  readonly createdAt: ISODateTime;
}

export interface AcademyMissionGrowthEventInput {
  readonly id: UUID;
  readonly occurredOn: string;
  readonly title: string;
  readonly description: string;
  readonly category: GrowthEventCategory;
  readonly missionId: UUID;
  readonly debriefId: UUID;
  readonly createdAt: ISODateTime;
}

export function createAcademyGrowthEventFromJournal(event: GrowthEvent): AcademyGrowthEvent {
  return {
    id: event.id,
    occurredOn: event.eventDate,
    title: event.title,
    description: event.description,
    category: event.category,
    evidence: {
      sourceType: 'journal_growth_event',
      growthEventId: event.id,
      journalSourceType: event.evidence.sourceType,
      journalSourceId: event.evidence.sourceId,
    },
    createdAt: event.createdAt,
  };
}

export function createAcademyGrowthEventFromMissionDebrief(
  input: AcademyMissionGrowthEventInput,
): AcademyGrowthEvent | undefined {
  const title = input.title.trim();
  const description = input.description.trim();
  const missionId = input.missionId.trim();
  const debriefId = input.debriefId.trim();

  if (!input.id.trim() || !input.occurredOn.trim() || !title || !description || !missionId || !debriefId) {
    return undefined;
  }

  return {
    id: input.id,
    occurredOn: input.occurredOn.trim(),
    title,
    description,
    category: input.category,
    evidence: {
      sourceType: 'mission_debrief',
      missionId,
      debriefId,
    },
    createdAt: input.createdAt,
  };
}

export function isAcademyGrowthEventTraceable(event: AcademyGrowthEvent): boolean {
  if (event.evidence.sourceType === 'journal_growth_event') {
    return event.evidence.growthEventId.trim().length > 0 && event.evidence.journalSourceId.trim().length > 0;
  }

  return event.evidence.missionId.trim().length > 0 && event.evidence.debriefId.trim().length > 0;
}
