import { describe, expect, it } from 'vitest';
import { createTradeReview, isTradeReviewLinkedToJournalEntry } from './TradeReview';

describe('TradeReview', () => {
  it('captures behavior-first trade review evidence without market prediction', () => {
    const review = createTradeReview(
      {
        tradeId: 'trade-001',
        reviewDate: '2026-06-29',
        followedPlan: true,
        emotionalState: 'Calm execution.',
        whatWentWell: 'Waited for the planned entry.',
        whatToImprove: 'Reduce hesitation at planned exit.',
        lessonsLearned: 'Predefine exit confirmation.',
        wouldTakeAgain: true,
        journalEntryId: 'journal-001',
      },
      {
        id: 'trade-review-001',
        now: '2026-06-29T22:00:00.000Z',
      },
    );

    expect(review).toEqual({
      id: 'trade-review-001',
      tradeId: 'trade-001',
      reviewDate: '2026-06-29',
      followedPlan: true,
      emotionalState: 'Calm execution.',
      whatWentWell: 'Waited for the planned entry.',
      whatToImprove: 'Reduce hesitation at planned exit.',
      lessonsLearned: 'Predefine exit confirmation.',
      wouldTakeAgain: true,
      journalEntryId: 'journal-001',
      createdAt: '2026-06-29T22:00:00.000Z',
    });
    expect(review).not.toHaveProperty('prediction');
    expect(review).not.toHaveProperty('marketForecast');
    expect(review && isTradeReviewLinkedToJournalEntry(review)).toBe(true);
  });

  it('rejects incomplete trade reviews', () => {
    expect(createTradeReview({
      tradeId: '',
      reviewDate: '2026-06-29',
      followedPlan: true,
      emotionalState: 'Calm.',
      whatWentWell: 'Waited.',
      whatToImprove: 'Exit.',
      lessonsLearned: 'Plan.',
      wouldTakeAgain: true,
    })).toBeUndefined();
    expect(createTradeReview({
      tradeId: 'trade-001',
      reviewDate: '2026-06-29',
      followedPlan: true,
      emotionalState: '',
      whatWentWell: 'Waited.',
      whatToImprove: 'Exit.',
      lessonsLearned: 'Plan.',
      wouldTakeAgain: true,
    })).toBeUndefined();
  });

  it('keeps trade reviews distinct from daily reflections', () => {
    const review = createTradeReview(
      {
        tradeId: 'trade-001',
        reviewDate: '2026-06-29',
        followedPlan: false,
        emotionalState: 'Rushed.',
        whatWentWell: 'Stopped when invalidated.',
        whatToImprove: 'Wait longer before entry.',
        lessonsLearned: 'No entry without confirmation.',
        wouldTakeAgain: false,
      },
      {
        id: 'trade-review-001',
        now: '2026-06-29T22:00:00.000Z',
      },
    );

    expect(review).not.toHaveProperty('reflectionDate');
    expect(review).not.toHaveProperty('disciplineObservation');
    expect(review && isTradeReviewLinkedToJournalEntry(review)).toBe(false);
  });
});
