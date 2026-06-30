import { describe, expect, it } from 'vitest';
import { evaluateGuardianRules, type GuardianRuleDefinition } from './GuardianRuleMonitoring';

const rules: GuardianRuleDefinition[] = [
  {
    id: 'rule-invalidation-defined',
    title: 'Invalidation Defined',
    description: 'Mission invalidation must be defined before deployment.',
    severity: 'breach',
  },
  {
    id: 'rule-risk-confirmed',
    title: 'Risk Confirmed',
    description: 'Mission risk must be confirmed before execution.',
    severity: 'caution',
  },
];

describe('Guardian rule monitoring', () => {
  it('evaluates explicit rules deterministically', () => {
    const result = evaluateGuardianRules(
      rules,
      [
        { ruleId: 'rule-invalidation-defined', passed: true, evidence: 'Invalidation present.' },
        { ruleId: 'rule-risk-confirmed', passed: true, evidence: 'Risk accepted.' },
      ],
      '2026-06-30T10:00:00.000Z',
    );

    expect(result).toEqual({
      evaluatedAt: '2026-06-30T10:00:00.000Z',
      totalRules: 2,
      passedRules: 2,
      violations: [],
      clear: true,
    });
  });

  it('represents violations clearly without discretionary advice', () => {
    const result = evaluateGuardianRules(
      rules,
      [{ ruleId: 'rule-invalidation-defined', passed: false, evidence: 'Invalidation missing.' }],
      '2026-06-30T10:00:00.000Z',
    );

    expect(result.clear).toBe(false);
    expect(result.passedRules).toBe(0);
    expect(result.violations).toHaveLength(2);
    expect(result.violations[0]?.evidence).toBe('Invalidation missing.');
    expect(result.violations[1]?.evidence).toBe('No rule evidence provided.');
  });
});
