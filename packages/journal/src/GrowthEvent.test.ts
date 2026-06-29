import { describe, expect, it } from 'vitest';
import { createGrowthEvent, isGrowthEventTraceable } from './GrowthEvent';

describe('GrowthEvent', () => {
  it('captures a journal-derived growth event with traceable evidence', () => {
    const event = createGrowthEvent(
      {
        eventDate: '2026-06-29',
        title: 'Waited for confirmation',
        description: 'Recognized patience in execution and avoided chasing price.',
        category: 'patience',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
      },
      {
        id: 'growth-001',
        now: '2026-06-29T23:00:00.000Z',
      },
    );

    expect(event).toEqual({
      id: 'growth-001',
      eventDate: '2026-06-29',
      title: 'Waited for confirmation',
      description: 'Recognized patience in execution and avoided chasing price.',
      category: 'patience',
      evidence: {
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
      },
      rewardStatus: 'not_awarded',
      createdAt: '2026-06-29T23:00:00.000Z',
    });
    expect(event && isGrowthEventTraceable(event)).toBe(true);
  });

  it('supports daily reflection and trade review evidence sources', () => {
    const reflectionEvent = createGrowthEvent({
      eventDate: '2026-06-29',
      title: 'Named the trigger',
      description: 'Captured the emotional trigger before it became behavior.',
      category: 'emotional_regulation',
      evidence: {
        sourceType: 'daily_reflection',
        sourceId: 'reflection-001',
      },
    });
    const tradeReviewEvent = createGrowthEvent({
      eventDate: '2026-06-29',
      title: 'Improved exit discipline',
      description: 'Used the review to identify a specific exit improvement.',
      category: 'discipline',
      evidence: {
        sourceType: 'trade_review',
        sourceId: 'trade-review-001',
      },
    });

    expect(reflectionEvent?.evidence.sourceType).toBe('daily_reflection');
    expect(tradeReviewEvent?.evidence.sourceType).toBe('trade_review');
  });

  it('rejects growth events without required journal evidence', () => {
    expect(createGrowthEvent({
      eventDate: '2026-06-29',
      title: 'Waited',
      description: 'Evidence is missing.',
      category: 'patience',
      evidence: {
        sourceType: 'journal_entry',
        sourceId: '',
      },
    })).toBeUndefined();
  });

  it('does not award Academy XP or rewards automatically', () => {
    const event = createGrowthEvent(
      {
        eventDate: '2026-06-29',
        title: 'Protected capital',
        description: 'Stopped trading after recognizing poor focus.',
        category: 'risk_awareness',
        evidence: {
          sourceType: 'daily_reflection',
          sourceId: 'reflection-001',
        },
      },
      {
        id: 'growth-001',
        now: '2026-06-29T23:00:00.000Z',
      },
    );

    expect(event?.rewardStatus).toBe('not_awarded');
    expect(event).not.toHaveProperty('xp');
    expect(event).not.toHaveProperty('points');
    expect(event).not.toHaveProperty('rewardAmount');
  });
});
