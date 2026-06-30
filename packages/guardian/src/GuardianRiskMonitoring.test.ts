import { describe, expect, it } from 'vitest';
import { evaluateGuardianRisk } from './GuardianRiskMonitoring';

describe('Guardian risk monitoring', () => {
  it('returns a clear deterministic state for complete low-risk inputs', () => {
    expect(
      evaluateGuardianRisk({
        dailyLossPercent: 0.5,
        ruleViolationCount: 0,
        revengeSignalCount: 0,
        fatigueLevel: 2,
      }),
    ).toEqual({
      level: 'clear',
      score: 0,
      reasons: [],
      missingInputs: [],
    });
  });

  it('classifies elevated risk with explainable reasons', () => {
    const result = evaluateGuardianRisk({
      dailyLossPercent: 5,
      ruleViolationCount: 1,
      revengeSignalCount: 1,
      fatigueLevel: 8,
    });

    expect(result.level).toBe('lock');
    expect(result.score).toBe(95);
    expect(result.reasons).toContain('Daily loss pressure is above intervention threshold.');
    expect(result.reasons).toContain('Rule violations are present.');
    expect(result.reasons).toContain('Revenge-trading signals are present.');
    expect(result.reasons).toContain('Fatigue level is elevated.');
  });

  it('handles missing data safely as attention', () => {
    const result = evaluateGuardianRisk({ dailyLossPercent: 0 });

    expect(result.level).toBe('attention');
    expect(result.missingInputs).toEqual(['ruleViolationCount', 'revengeSignalCount', 'fatigueLevel']);
    expect(result.reasons).toContain('Risk assessment has missing inputs.');
  });
});
