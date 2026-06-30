import { describe, expect, it } from 'vitest';
import { buildGuardianAlerts } from './GuardianAlerts';
import { evaluateGuardianDailyLimits } from './GuardianDailyLimits';
import { evaluateGuardianLockout } from './GuardianLockout';
import { buildGuardianPsychologyWarnings } from './GuardianPsychologyWarnings';
import { evaluateGuardianRisk } from './GuardianRiskMonitoring';
import { evaluateGuardianRules } from './GuardianRuleMonitoring';
import { evaluateGuardianSessionLimits } from './GuardianSessionLimits';

describe('Sprint 8 Guardian review', () => {
  it('composes Guardian protective systems without persistence or market prediction', () => {
    const ruleResult = evaluateGuardianRules(
      [{ id: 'invalidation', title: 'Invalidation', description: 'Invalidation required.', severity: 'breach' }],
      [{ ruleId: 'invalidation', passed: false, evidence: 'Invalidation missing.' }],
      '2026-06-30T12:00:00.000Z',
    );
    const risk = evaluateGuardianRisk({
      dailyLossPercent: 3,
      ruleViolationCount: 1,
      revengeSignalCount: 0,
      fatigueLevel: 5,
    });
    const dailyLimits = evaluateGuardianDailyLimits(
      { maxLossPercent: 4, warningPercent: 75, maxTrades: 3 },
      { lossPercent: 3, tradesTaken: 1 },
    );
    const sessionLimits = evaluateGuardianSessionLimits(
      { maxMinutes: 120, warningPercent: 75, maxActions: 4 },
      { elapsedMinutes: 90, actionsTaken: 1 },
    );
    const psychologyWarnings = buildGuardianPsychologyWarnings([
      { id: 'journal-001', signal: 'rule_negotiation', source: 'journal', excerpt: 'Maybe this rule can bend.' },
    ]);
    const alerts = buildGuardianAlerts([
      { id: 'risk-001', title: 'Risk Attention', detail: risk.reasons[0] ?? 'Risk attention.', severity: 'caution' },
    ]);
    const lockout = evaluateGuardianLockout([{ id: 'daily-limit', reason: 'Daily limit breached.', active: false }]);

    expect(ruleResult.clear).toBe(false);
    expect(risk.level).toBe('attention');
    expect(dailyLimits.status).toBe('warning');
    expect(sessionLimits.status).toBe('warning');
    expect(psychologyWarnings[0]?.message).toBe('Rule negotiation is present; follow the accepted doctrine before acting.');
    expect(alerts[0]?.priority).toBe('medium');
    expect(lockout.status).toBe('unlocked');
  });
});
