import { describe, expect, it } from 'vitest';
import {
  canAllocateMissionRisk,
  evaluateGuardianCapitalProtection,
  getRemainingDailyRisk,
  reloadGuardianCapitalAllocation,
  type GuardianCapitalProtectionInput,
} from './GuardianCapitalProtection';
import type { GuardianCapitalAllocation } from './GuardianProtection';

const allocation: GuardianCapitalAllocation = {
  missionRiskLimit: '1%',
  dailyRiskLimit: '2%',
  allocatedRisk: 1,
  consumedRisk: 0.5,
  remainingRisk: 1.5,
  reservedRisk: 0,
  activeExposure: 0,
  riskUnit: 'percentage',
  sourceMissionIds: ['mission-0'],
  lastUpdated: '2026-07-13T00:00:00.000Z',
};

const baseInput: GuardianCapitalProtectionInput = {
  missionId: 'mission-1',
  evaluatedAt: '2026-07-13T00:01:00.000Z',
  allocation,
  riskUnit: 'percentage',
  declaredMissionRisk: 0.5,
  requestedAuthorizationRisk: 0.5,
};

describe('GuardianCapitalProtection', () => {
  it('allows risk inside allocation', () => {
    const decision = evaluateGuardianCapitalProtection(baseInput);

    expect(decision.verdict).toBe('monitor');
    expect(decision.restrictions).toEqual([]);
    expect(canAllocateMissionRisk(allocation, 0.5, 'percentage')).toBe(true);
  });

  it('denies mission risk above limit and returns a recovery requirement', () => {
    const decision = evaluateGuardianCapitalProtection({
      ...baseInput,
      declaredMissionRisk: 2,
      requestedAuthorizationRisk: 2,
    });

    expect(decision.verdict).toBe('deny_authorization');
    expect(decision.restrictions[0]?.blockedActions).toContain('request_authorization');
    expect(decision.recoveryPlans[0]?.requirements[0]).toMatch(/Reduce requested risk/iu);
  });

  it('requests clarification when risk is missing', () => {
    const decision = evaluateGuardianCapitalProtection({
      missionId: baseInput.missionId,
      evaluatedAt: baseInput.evaluatedAt,
      allocation: baseInput.allocation,
      riskUnit: baseInput.riskUnit,
    });

    expect(decision.verdict).toBe('require_clarification');
    expect(decision.evaluations[0]?.result).toBe('missing_evidence');
  });

  it('consumed risk reduces remaining risk and can enforce lockout', () => {
    const exhausted = { ...allocation, remainingRisk: 0.1 };
    const decision = evaluateGuardianCapitalProtection({
      ...baseInput,
      allocation: exhausted,
      requestedDeploymentRisk: 0.5,
    });

    expect(getRemainingDailyRisk(exhausted)).toBe(0.1);
    expect(decision.verdict).toBe('enforce_lockout');
    expect(decision.restrictions.some((item) => item.blockedActions.includes('deploy_mission'))).toBe(true);
  });

  it('does not excuse profitable risk violations', () => {
    const decision = evaluateGuardianCapitalProtection({
      ...baseInput,
      declaredMissionRisk: 2,
      requestedAuthorizationRisk: 2,
      outcome: 'profitable',
    });

    expect(decision.explanation).toMatch(/profitable outcome does not suppress/iu);
    expect(decision.verdict).toBe('deny_authorization');
  });

  it('does not restrict disciplined losses when risk was respected', () => {
    const decision = evaluateGuardianCapitalProtection({
      ...baseInput,
      outcome: 'loss',
    });

    expect(decision.verdict).toBe('monitor');
    expect(decision.explanation).toMatch(/Loss remained inside declared risk/iu);
  });

  it('rejects mixed risk units unless a conversion policy exists', () => {
    expect(() => evaluateGuardianCapitalProtection({
      ...baseInput,
      riskUnit: 'R_multiple',
    })).toThrow(/cannot mix/iu);
  });

  it('preserves allocation through reload and remains idempotent', () => {
    const reloaded = reloadGuardianCapitalAllocation(allocation);
    const first = evaluateGuardianCapitalProtection(baseInput);
    const second = evaluateGuardianCapitalProtection({ ...baseInput, allocation: reloaded });

    expect(reloaded.sourceMissionIds).toEqual(['mission-0']);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);
  });
});
