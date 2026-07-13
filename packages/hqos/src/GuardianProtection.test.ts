import { describe, expect, it } from 'vitest';
import {
  createGuardianRecoveryPlan,
  createGuardianRestriction,
  createGuardianRule,
  evaluateGuardianRuleResult,
  getGuardianBlockedActions,
  getGuardianHighestSeverity,
  getGuardianRecoveryPlan,
  isGuardianActionBlocked,
  resolveGuardianRestriction,
  supersedeGuardianRuleEvaluation,
  upsertGuardianRuleEvaluation,
  type GuardianEvidence,
} from './GuardianProtection';

const evidence: GuardianEvidence = {
  evidenceId: 'risk:mission-1',
  source: 'mission-context',
  description: 'Declared risk exceeds mission limit.',
  missionId: 'mission-1',
};

const rule = createGuardianRule({
  ruleId: 'risk-limit',
  title: 'Risk limit',
  description: 'Mission risk must remain inside declared allocation.',
  category: 'risk',
  severity: 'restriction',
  triggerCondition: 'requested risk > mission risk limit',
  evidenceRequirements: ['declared risk', 'mission risk limit'],
  operationalEffect: 'War Room authorization is restricted until risk is reduced.',
  recoveryPolicy: 'Reduce requested risk or update the mission plan.',
  relatedDoctrineIds: ['doctrine:risk'],
  enabled: true,
  version: 1,
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
});

describe('GuardianProtection', () => {
  it('creates immutable Guardian rules with evidence requirements', () => {
    expect(rule.ruleId).toBe('risk-limit');
    expect(Object.isFrozen(rule.evidenceRequirements)).toBe(true);
  });

  it('creates deterministic evaluation identity and deduplicates repeated processing', () => {
    const first = evaluateGuardianRuleResult({
      rule,
      missionId: 'mission-1',
      evidence: [evidence],
      triggered: true,
      evaluatedAt: '2026-07-13T00:01:00.000Z',
    });
    const second = evaluateGuardianRuleResult({
      rule,
      missionId: 'mission-1',
      evidence: [evidence],
      triggered: true,
      evaluatedAt: '2026-07-13T00:01:00.000Z',
    });

    expect(first.evaluationId).toBe(second.evaluationId);
    expect(upsertGuardianRuleEvaluation([first], second)).toHaveLength(1);
  });

  it('derives blocked actions from active restrictions', () => {
    const restriction = createGuardianRestriction({
      restrictionId: 'restriction:risk-limit',
      ruleId: rule.ruleId,
      missionId: 'mission-1',
      blockedActions: ['request_authorization', 'deploy_mission'],
      explanation: 'Risk exceeds allocation.',
      evidenceReferences: [evidence],
      startedAt: '2026-07-13T00:01:00.000Z',
      recoveryPlanId: 'recovery:risk-limit',
      status: 'active',
    });

    expect(getGuardianBlockedActions([restriction])).toEqual(['deploy_mission', 'request_authorization']);
    expect(isGuardianActionBlocked([restriction], 'deploy_mission')).toBe(true);
  });

  it('disabled rules produce no action', () => {
    const disabledRule = createGuardianRule({ ...rule, enabled: false, updatedAt: '2026-07-13T00:02:00.000Z' });
    const evaluation = evaluateGuardianRuleResult({
      rule: disabledRule,
      missionId: 'mission-1',
      evidence: [evidence],
      triggered: true,
      evaluatedAt: '2026-07-13T00:02:00.000Z',
    });

    expect(evaluation.result).toBe('disabled');
    expect(evaluation.state).toBe('secure');
    expect(evaluation.evidenceReferences).toEqual([]);
  });

  it('keeps recovery plans attached and preserves resolved restriction history', () => {
    const plan = createGuardianRecoveryPlan({
      recoveryPlanId: 'recovery:risk-limit',
      missionId: 'mission-1',
      title: 'Reduce mission risk',
      requirements: ['Reduce requested risk below the mission limit.'],
      evidenceReferences: [evidence],
      status: 'pending',
      createdAt: '2026-07-13T00:01:00.000Z',
    });
    const restriction = createGuardianRestriction({
      restrictionId: 'restriction:risk-limit',
      ruleId: rule.ruleId,
      missionId: 'mission-1',
      blockedActions: ['request_authorization'],
      explanation: 'Risk exceeds allocation.',
      evidenceReferences: [evidence],
      startedAt: '2026-07-13T00:01:00.000Z',
      recoveryPlanId: plan.recoveryPlanId,
      status: 'active',
    });

    const resolved = resolveGuardianRestriction(restriction, { resolvedAt: '2026-07-13T00:05:00.000Z' });

    expect(getGuardianRecoveryPlan([plan], restriction.recoveryPlanId)?.recoveryPlanId).toBe(plan.recoveryPlanId);
    expect(resolved.status).toBe('resolved');
    expect(resolved.ruleId).toBe(rule.ruleId);
    expect(isGuardianActionBlocked([resolved], 'request_authorization')).toBe(false);
  });

  it('returns highest severity deterministically and supersedes evaluations', () => {
    const evaluation = evaluateGuardianRuleResult({
      rule,
      missionId: 'mission-1',
      evidence: [evidence],
      triggered: true,
      evaluatedAt: '2026-07-13T00:01:00.000Z',
    });

    expect(getGuardianHighestSeverity(['warning', 'lockout', 'restriction'])).toBe('lockout');
    expect(supersedeGuardianRuleEvaluation(evaluation, {
      clearedAt: '2026-07-13T00:06:00.000Z',
      sourceRevision: '2',
    }).state).toBe('restored');
  });

  it('rejects unsupported restrictions', () => {
    expect(() => createGuardianRestriction({
      restrictionId: 'restriction:broken',
      ruleId: rule.ruleId,
      missionId: 'mission-1',
      blockedActions: [],
      explanation: 'No supported blocked action.',
      evidenceReferences: [evidence],
      startedAt: '2026-07-13T00:01:00.000Z',
      status: 'active',
    })).toThrow(/block at least one/iu);
  });
});
