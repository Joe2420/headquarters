import type { ISODateTime, UUID } from '@headquarters/shared';

export type GrowthEventSourceType = 'journal_entry' | 'daily_reflection' | 'trade_review';
export type GrowthEventCategory =
  | 'discipline'
  | 'patience'
  | 'risk_awareness'
  | 'emotional_regulation'
  | 'process_improvement';

export interface GrowthEventEvidenceReference {
  readonly sourceType: GrowthEventSourceType;
  readonly sourceId: UUID;
}

export interface GrowthEventDraft {
  readonly eventDate: string;
  readonly title: string;
  readonly description: string;
  readonly category: GrowthEventCategory;
  readonly evidence: GrowthEventEvidenceReference;
}

export interface GrowthEvent {
  readonly id: UUID;
  readonly eventDate: string;
  readonly title: string;
  readonly description: string;
  readonly category: GrowthEventCategory;
  readonly evidence: GrowthEventEvidenceReference;
  readonly rewardStatus: 'not_awarded';
  readonly createdAt: ISODateTime;
}

export interface CreateGrowthEventOptions {
  readonly id?: UUID;
  readonly now?: ISODateTime;
}

export function createGrowthEvent(
  draft: GrowthEventDraft,
  options: CreateGrowthEventOptions = {},
): GrowthEvent | undefined {
  const eventDate = draft.eventDate.trim();
  const title = draft.title.trim();
  const description = draft.description.trim();
  const sourceId = draft.evidence.sourceId.trim();

  if (!eventDate || !title || !description || !sourceId) return undefined;

  return {
    id: options.id ?? crypto.randomUUID(),
    eventDate,
    title,
    description,
    category: draft.category,
    evidence: {
      sourceType: draft.evidence.sourceType,
      sourceId,
    },
    rewardStatus: 'not_awarded',
    createdAt: options.now ?? new Date().toISOString(),
  };
}

export function isGrowthEventTraceable(event: GrowthEvent): boolean {
  return event.evidence.sourceId.trim().length > 0;
}
