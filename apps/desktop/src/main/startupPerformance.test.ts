import { describe, expect, it } from 'vitest';
import { summarizeStartupPerformance } from './startupPerformance';

describe('summarizeStartupPerformance', () => {
  it('records startup duration and budget status deterministically', () => {
    expect(summarizeStartupPerformance({
      startedAtMs: 100,
      completedAtMs: 725,
      migrationCount: 7,
      budgetMs: 1000,
    })).toEqual({
      durationMs: 625,
      migrationCount: 7,
      budgetMs: 1000,
      status: 'within-budget',
    });
  });

  it('flags startup measurements that exceed the beta budget', () => {
    expect(summarizeStartupPerformance({
      startedAtMs: 100,
      completedAtMs: 1601,
      migrationCount: 7,
      budgetMs: 1000,
    }).status).toBe('over-budget');
  });
});
