import type { ISODateTime, UUID } from '@headquarters/shared';

export interface TradeReviewDraft {
  readonly tradeId: UUID;
  readonly reviewDate: string;
  readonly followedPlan: boolean;
  readonly emotionalState: string;
  readonly whatWentWell: string;
  readonly whatToImprove: string;
  readonly lessonsLearned: string;
  readonly wouldTakeAgain: boolean;
  readonly journalEntryId?: UUID;
}

export interface TradeReview {
  readonly id: UUID;
  readonly tradeId: UUID;
  readonly reviewDate: string;
  readonly followedPlan: boolean;
  readonly emotionalState: string;
  readonly whatWentWell: string;
  readonly whatToImprove: string;
  readonly lessonsLearned: string;
  readonly wouldTakeAgain: boolean;
  readonly journalEntryId?: UUID;
  readonly createdAt: ISODateTime;
}

export interface CreateTradeReviewOptions {
  readonly id?: UUID;
  readonly now?: ISODateTime;
}

export function createTradeReview(
  draft: TradeReviewDraft,
  options: CreateTradeReviewOptions = {},
): TradeReview | undefined {
  const tradeId = draft.tradeId.trim();
  const reviewDate = draft.reviewDate.trim();
  const emotionalState = draft.emotionalState.trim();
  const whatWentWell = draft.whatWentWell.trim();
  const whatToImprove = draft.whatToImprove.trim();
  const lessonsLearned = draft.lessonsLearned.trim();
  const journalEntryId = normalizeOptionalText(draft.journalEntryId);

  if (!tradeId || !reviewDate || !emotionalState || !whatWentWell || !whatToImprove || !lessonsLearned) {
    return undefined;
  }

  return {
    id: options.id ?? crypto.randomUUID(),
    tradeId,
    reviewDate,
    followedPlan: draft.followedPlan,
    emotionalState,
    whatWentWell,
    whatToImprove,
    lessonsLearned,
    wouldTakeAgain: draft.wouldTakeAgain,
    ...(journalEntryId !== undefined ? { journalEntryId } : {}),
    createdAt: options.now ?? new Date().toISOString(),
  };
}

export function isTradeReviewLinkedToJournalEntry(review: TradeReview): boolean {
  return review.journalEntryId !== undefined;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
