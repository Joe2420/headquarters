import { describe, expect, it } from 'vitest';
import { evaluateGuardianCapitalProtection } from './GuardianCapitalProtection';
import { evaluateGuardianJudgmentReserve } from './GuardianJudgmentReserve';
import { evaluateGuardianProtection } from './GuardianProtectionEngine';
import { evaluateGuardianSuccessProtocol } from './GuardianSuccessProtocol';
import { createOperationalConsequence } from './OperationalConsequence';
import type { MissionLifecycleProjection, MissionLifecycleStage } from './MissionLifecycleProjection';
import type { GuardianCapitalAllocation } from './GuardianProtection';

const evaluatedAt = '2026-07-13T00:00:00.000Z';

function lifecycle(stage: MissionLifecycleStage): MissionLifecycleProjection {
  return {
    missionId: 'mission-1',
    activeStage: stage,
    completedStages: [],
    availableRooms: ['command-center', 'mission-room'],
    recommendedRoom: stage === 'authorization' || stage === 'deployed' ? 'war-room' : 'ready-room',
    currentPrimaryAction: {
      id: 'next',
      label: 'Next',
      room: stage === 'authorization' || stage === 'deployed' ? 'war-room' : 'ready-room',
      explanation: 'Continue lifecycle.',
      disabled: false,
    },
    blockedActions: [],
    transitionReason: 'Continue lifecycle.',
    missionCompletionState: 'active',
    missionActive: true,
    missionComplete: false,
  };
}

const allocation: GuardianCapitalAllocation = {
  allocatedRisk: 1,
  consumedRisk: 0,
  remainingRisk: 1,
  reservedRisk: 0,
  activeExposure: 0,
  riskUnit: 'percentage',
  sourceMissionIds: [],
  lastUpdated: evaluatedAt,
};

describe('GuardianProtectionEngine', () => {
  it('returns a secure mission decision when no protection issues exist', () => {
    const decision = evaluateGuardianProtection({
      missionId: 'mission-1',
      evaluatedAt,
      lifecycle: lifecycle('briefing'),
      missionContext: {
        missionObjective: 'Observe NQ',
        riskLimit: '0.5%',
        operatorCondition: 'focused',
      },
    });

    expect(decision.state).toBe('secure');
    expect(decision.verdict).toBe('no_action');
    expect(decision.noOpReason).toMatch(/no active/iu);
  });

  it('restricts authorization when protective rule is missing', () => {
    const decision = evaluateGuardianProtection({
      missionId: 'mission-1',
      evaluatedAt,
      lifecycle: lifecycle('authorization'),
      missionContext: {
        missionObjective: 'Observe NQ',
        riskLimit: '0.5%',
        operatorCondition: 'focused',
        authorizationReasoning: 'Breakout with invalidation.',
      },
    });

    expect(decision.verdict).toBe('deny_authorization');
    expect(decision.triggeredRules[0]?.ruleId).toBe('guardian-protective-rule-required');
  });

  it('consumes capital protection restrictions', () => {
    const capitalProtection = evaluateGuardianCapitalProtection({
      missionId: 'mission-1',
      evaluatedAt,
      allocation,
      declaredMissionRisk: 2,
      requestedAuthorizationRisk: 2,
      riskUnit: 'percentage',
    });
    const decision = evaluateGuardianProtection({
      missionId: 'mission-1',
      evaluatedAt,
      lifecycle: lifecycle('authorization'),
      missionContext: { missionObjective: 'Observe NQ', riskLimit: '2%', operatorCondition: 'focused', protectiveRule: 'Hard stop' },
      capitalProtection,
    });

    expect(decision.blockedActions).toContain('request_authorization');
    expect(decision.verdict).toBe('deny_authorization');
  });

  it('suspends deployment when Judgment Reserve is depleted', () => {
    const judgmentReserve = evaluateGuardianJudgmentReserve({
      evaluatedAt,
      activeConsequenceSeverity: 'lockout',
      unresolvedGuardianWarningCount: 3,
    }).reserve;
    const decision = evaluateGuardianProtection({
      missionId: 'mission-1',
      evaluatedAt,
      lifecycle: lifecycle('authorization'),
      missionContext: { missionObjective: 'Observe NQ', riskLimit: '0.5%', operatorCondition: 'focused', protectiveRule: 'Hard stop' },
      judgmentReserve,
    });

    expect(decision.verdict).toBe('suspend_deployment');
    expect(decision.CommanderSignal).toBe('lockout');
  });

  it('surfaces success-protocol caution without PnL-only lockout', () => {
    const successProtocol = evaluateGuardianSuccessProtocol({
      missionId: 'mission-3',
      evaluatedAt,
      recentMissions: [
        { missionId: 'mission-1', completedAt: '2026-07-11T00:00:00.000Z', profitableOutcome: true, requestedRisk: 0.5 },
        { missionId: 'mission-2', completedAt: '2026-07-12T00:00:00.000Z', profitableOutcome: true, requestedRisk: 1 },
      ],
    });
    const decision = evaluateGuardianProtection({
      missionId: 'mission-3',
      evaluatedAt,
      lifecycle: lifecycle('authorization'),
      missionContext: { missionObjective: 'Observe NQ', riskLimit: '1%', operatorCondition: 'confident', protectiveRule: 'Hard stop' },
      successProtocol,
    });

    expect(decision.verdict).toBe('caution_operator');
    expect(decision.activeRestrictions).toEqual([]);
  });

  it('uses deployed invalidation and consequence evidence without duplicating consequence policy', () => {
    const consequence = createOperationalConsequence({
      consequenceId: 'consequence:mission-1:guardian',
      missionId: 'mission-1',
      category: 'guardian',
      type: 'guardian_warning_unresolved',
      severity: 'restriction',
      title: 'Guardian warning',
      explanation: 'Invalidation is approaching and requires review.',
      cause: 'Deployed check-in reported invalidation near.',
      effect: 'Authorization remains restricted until reviewed.',
      evidenceReferences: [{ id: 'check-in-1', source: 'deployed-check-in' }],
      createdAt: evaluatedAt,
      activatedAt: evaluatedAt,
    });
    const decision = evaluateGuardianProtection({
      missionId: 'mission-1',
      evaluatedAt,
      lifecycle: lifecycle('deployed'),
      operationalConsequences: [consequence],
      deployedCheckIns: [{ status: 'invalidation_near', createdAt: evaluatedAt }],
    });

    expect(decision.verdict).toBe('deny_authorization');
    expect(decision.activeRestrictions[0]?.ruleId).toBe('consequence:guardian_warning_unresolved');
  });

  it('clears restriction after recovery removes active inputs and remains idempotent', () => {
    const input = {
      missionId: 'mission-1',
      evaluatedAt,
      lifecycle: lifecycle('authorization'),
      missionContext: { missionObjective: 'Observe NQ', riskLimit: '0.5%', operatorCondition: 'focused', protectiveRule: 'Hard stop' },
    };

    const first = evaluateGuardianProtection(input);
    const second = evaluateGuardianProtection(input);

    expect(first.activeRestrictions).toEqual([]);
    expect(first).toEqual(second);
  });
});
