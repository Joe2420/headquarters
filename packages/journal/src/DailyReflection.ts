import type { ISODateTime, UUID } from '@headquarters/shared';

export interface DailyReflectionDraft {
  readonly reflectionDate: string;
  readonly behaviorSummary: string;
  readonly emotionalState: string;
  readonly disciplineObservation: string;
  readonly lesson?: string;
  readonly journalEntryId?: UUID;
}

export interface DailyReflection {
  readonly id: UUID;
  readonly reflectionDate: string;
  readonly behaviorSummary: string;
  readonly emotionalState: string;
  readonly disciplineObservation: string;
  readonly lesson?: string;
  readonly journalEntryId?: UUID;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface CreateDailyReflectionOptions {
  readonly id?: UUID;
  readonly now?: ISODateTime;
}

export function createDailyReflection(
  draft: DailyReflectionDraft,
  options: CreateDailyReflectionOptions = {},
): DailyReflection | undefined {
  const reflectionDate = draft.reflectionDate.trim();
  const behaviorSummary = draft.behaviorSummary.trim();
  const emotionalState = draft.emotionalState.trim();
  const disciplineObservation = draft.disciplineObservation.trim();

  if (!reflectionDate || !behaviorSummary || !emotionalState || !disciplineObservation) return undefined;

  const timestamp = options.now ?? new Date().toISOString();
  const lesson = normalizeOptionalText(draft.lesson);
  const journalEntryId = normalizeOptionalText(draft.journalEntryId);

  return {
    id: options.id ?? crypto.randomUUID(),
    reflectionDate,
    behaviorSummary,
    emotionalState,
    disciplineObservation,
    ...(lesson !== undefined ? { lesson } : {}),
    ...(journalEntryId !== undefined ? { journalEntryId } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function isDailyReflectionLinkedToJournalEntry(reflection: DailyReflection): boolean {
  return reflection.journalEntryId !== undefined;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
