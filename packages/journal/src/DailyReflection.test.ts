import { describe, expect, it } from 'vitest';
import { createDailyReflection, isDailyReflectionLinkedToJournalEntry } from './DailyReflection';

describe('DailyReflection', () => {
  it('captures behavior-focused daily reflection data distinct from trade review fields', () => {
    const reflection = createDailyReflection(
      {
        reflectionDate: '2026-06-29',
        behaviorSummary: 'Waited for confirmation before acting.',
        emotionalState: 'Calm but alert.',
        disciplineObservation: 'No rule drift detected.',
        lesson: 'Prepare invalidation earlier.',
        journalEntryId: 'journal-001',
      },
      {
        id: 'reflection-001',
        now: '2026-06-29T21:00:00.000Z',
      },
    );

    expect(reflection).toEqual({
      id: 'reflection-001',
      reflectionDate: '2026-06-29',
      behaviorSummary: 'Waited for confirmation before acting.',
      emotionalState: 'Calm but alert.',
      disciplineObservation: 'No rule drift detected.',
      lesson: 'Prepare invalidation earlier.',
      journalEntryId: 'journal-001',
      createdAt: '2026-06-29T21:00:00.000Z',
      updatedAt: '2026-06-29T21:00:00.000Z',
    });
    expect(reflection).not.toHaveProperty('tradeId');
    expect(reflection).not.toHaveProperty('followedPlan');
    expect(reflection && isDailyReflectionLinkedToJournalEntry(reflection)).toBe(true);
  });

  it('rejects incomplete daily reflections', () => {
    expect(createDailyReflection({
      reflectionDate: '',
      behaviorSummary: 'Waited.',
      emotionalState: 'Calm.',
      disciplineObservation: 'Stable.',
    })).toBeUndefined();
    expect(createDailyReflection({
      reflectionDate: '2026-06-29',
      behaviorSummary: '',
      emotionalState: 'Calm.',
      disciplineObservation: 'Stable.',
    })).toBeUndefined();
  });

  it('keeps optional journal evidence links optional', () => {
    const reflection = createDailyReflection(
      {
        reflectionDate: '2026-06-29',
        behaviorSummary: 'Protected patience.',
        emotionalState: 'Focused.',
        disciplineObservation: 'No chasing.',
      },
      {
        id: 'reflection-001',
        now: '2026-06-29T21:00:00.000Z',
      },
    );

    if (!reflection) throw new Error('Expected daily reflection fixture');

    expect(isDailyReflectionLinkedToJournalEntry(reflection)).toBe(false);
  });
});
