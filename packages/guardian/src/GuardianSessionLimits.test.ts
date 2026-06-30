import { describe, expect, it } from 'vitest';
import { evaluateGuardianSessionLimits, type GuardianSessionLimitConfig } from './GuardianSessionLimits';

const config: GuardianSessionLimitConfig = {
  maxMinutes: 120,
  warningPercent: 75,
  maxActions: 4,
};

describe('Guardian session limits', () => {
  it('evaluates session limits separately from daily limits', () => {
    expect(evaluateGuardianSessionLimits(config, { elapsedMinutes: 30, actionsTaken: 1 })).toEqual({
      status: 'clear',
      timeUsagePercent: 25,
      actionUsagePercent: 25,
      warnings: [],
    });
  });

  it('returns deterministic session warnings', () => {
    const result = evaluateGuardianSessionLimits(config, { elapsedMinutes: 90, actionsTaken: 2 });

    expect(result.status).toBe('warning');
    expect(result.warnings).toEqual(['Session time limit warning.']);
  });

  it('represents breached session limits locally', () => {
    const result = evaluateGuardianSessionLimits(config, { elapsedMinutes: 125, actionsTaken: 4 });

    expect(result.status).toBe('breached');
    expect(result.warnings).toEqual(['Session time limit breached.', 'Session action limit breached.']);
  });
});
