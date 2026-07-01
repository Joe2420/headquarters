export interface StartupPerformanceInput {
  readonly startedAtMs: number;
  readonly completedAtMs: number;
  readonly migrationCount: number;
  readonly budgetMs: number;
}

export interface StartupPerformanceSummary {
  readonly durationMs: number;
  readonly migrationCount: number;
  readonly budgetMs: number;
  readonly status: 'within-budget' | 'over-budget';
}

export function summarizeStartupPerformance(input: StartupPerformanceInput): StartupPerformanceSummary {
  const durationMs = Math.max(0, Math.round(input.completedAtMs - input.startedAtMs));
  const budgetMs = Math.max(0, Math.round(input.budgetMs));

  return {
    durationMs,
    migrationCount: input.migrationCount,
    budgetMs,
    status: durationMs <= budgetMs ? 'within-budget' : 'over-budget',
  };
}
