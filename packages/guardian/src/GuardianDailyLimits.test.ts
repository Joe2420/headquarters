import { describe, expect, it } from 'vitest';
import { evaluateGuardianDailyLimits, type GuardianDailyLimitConfig } from './GuardianDailyLimits';

const config: GuardianDailyLimitConfig = {
  maxLossPercent: 4,
  warningPercent: 75,
  maxTrades: 3,
};

describe('Guardian daily limits', () => {
  it('evaluates clear daily limits deterministically', () => {
    expect(evaluateGuardianDailyLimits(config, { lossPercent: 1, tradesTaken: 1 })).toEqual({
      status: 'clear',
      lossUsagePercent: 25,
      tradeUsagePercent: 33,
      warnings: [],
    });
  });

  it('returns deterministic warnings near configured limits', () => {
    const result = evaluateGuardianDailyLimits(config, { lossPercent: 3, tradesTaken: 2 });

    expect(result.status).toBe('warning');
    expect(result.warnings).toEqual(['Daily loss limit warning.']);
  });

  it('represents breached daily limits without broker integration', () => {
    const result = evaluateGuardianDailyLimits(config, { lossPercent: 4.5, tradesTaken: 3 });

    expect(result.status).toBe('breached');
    expect(result.warnings).toEqual(['Daily loss limit breached.', 'Daily trade limit breached.']);
  });
});
