import {
  createGuardianRecoveryPlan,
  createGuardianRestriction,
  createGuardianRule,
  evaluateGuardianRuleResult,
  type GuardianCapitalAllocation,
  type GuardianEvidence,
  type GuardianRecoveryPlan,
  type GuardianRestriction,
  type GuardianRule,
  type GuardianRuleEvaluation,
  type GuardianVerdict,
} from './GuardianProtection';

export type GuardianRiskUnit = GuardianCapitalAllocation['riskUnit'];

export interface GuardianCapitalProtectionInput {
  readonly missionId: string;
  readonly evaluatedAt: string;
  readonly allocation: GuardianCapitalAllocation;
  readonly declaredMissionRisk?: number;
  readonly requestedAuthorizationRisk?: number;
  readonly requestedDeploymentRisk?: number;
  readonly outcome?: 'profitable' | 'loss' | 'flat' | 'unknown';
  readonly riskUnit: GuardianRiskUnit;
  readonly repeatedRiskViolationCount?: number;
  readonly existingRestrictions?: readonly GuardianRestriction[];
}

export interface GuardianCapitalProtectionDecision {
  readonly verdict: GuardianVerdict;
  readonly explanation: string;
  readonly allocation: GuardianCapitalAllocation;
  readonly evaluations: readonly GuardianRuleEvaluation[];
  readonly restrictions: readonly GuardianRestriction[];
  readonly recoveryPlans: readonly GuardianRecoveryPlan[];
  readonly evidence: readonly GuardianEvidence[];
  readonly remainingDailyRisk: number;
  readonly availableMissionRisk: number;
  readonly idempotencyKey: string;
}

const missingRiskRule: GuardianRule = createGuardianRule({
  ruleId: 'guardian-risk-declaration-required',
  title: 'Risk declaration required',
  description: 'Mission risk must be declared before War Room authorization.',
  category: 'risk',
  severity: 'caution',
  triggerCondition: 'mission risk declaration is missing',
  evidenceRequirements: ['mission risk declaration'],
  operationalEffect: 'Commander must request clarification before authorization.',
  recoveryPolicy: 'State the maximum acceptable mission risk.',
  relatedDoctrineIds: [],
  enabled: true,
  version: 1,
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
});

const missionRiskRule: GuardianRule = createGuardianRule({
  ruleId: 'guardian-mission-risk-limit',
  title: 'Mission risk limit',
  description: 'Requested mission risk must remain inside configured mission allocation.',
  category: 'capital',
  severity: 'restriction',
  triggerCondition: 'requested or declared risk exceeds available mission risk',
  evidenceRequirements: ['requested risk', 'mission allocation'],
  operationalEffect: 'Authorization is denied until risk is reduced.',
  recoveryPolicy: 'Reduce requested risk below available mission allocation.',
  relatedDoctrineIds: [],
  enabled: true,
  version: 1,
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
});

const dailyRiskRule: GuardianRule = createGuardianRule({
  ruleId: 'guardian-daily-risk-exhausted',
  title: 'Daily risk exhausted',
  description: 'Deployment cannot consume risk beyond the daily allocation.',
  category: 'capital',
  severity: 'lockout',
  triggerCondition: 'requested deployment risk exceeds remaining daily allocation',
  evidenceRequirements: ['remaining daily risk', 'requested deployment risk'],
  operationalEffect: 'Deployment is locked out until the next defined allocation period or recovery review.',
  recoveryPolicy: 'Wait until next allocation period or complete Guardian review.',
  relatedDoctrineIds: [],
  enabled: true,
  version: 1,
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
});

export function evaluateGuardianCapitalProtection(
  input: GuardianCapitalProtectionInput,
): GuardianCapitalProtectionDecision {
  assertSameRiskUnit(input);
  const evidence = buildCapitalEvidence(input);
  const evaluations: GuardianRuleEvaluation[] = [];
  const restrictions: GuardianRestriction[] = [];
  const recoveryPlans: GuardianRecoveryPlan[] = [];
  const availableMissionRisk = getAvailableMissionRisk(input.allocation);
  const remainingDailyRisk = getRemainingDailyRisk(input.allocation);
  const declaredRisk = input.declaredMissionRisk;
  const authorizationRisk = input.requestedAuthorizationRisk ?? declaredRisk;
  const deploymentRisk = input.requestedDeploymentRisk;

  if (declaredRisk === undefined) {
    evaluations.push(evaluateGuardianRuleResult({
      rule: missingRiskRule,
      missionId: input.missionId,
      evidence,
      missingEvidence: ['declared mission risk'],
      triggered: false,
      evaluatedAt: input.evaluatedAt,
    }));
    return decision(input, {
      verdict: 'require_clarification',
      explanation: 'Mission risk is not declared. Guardian requires clarification before authorization.',
      evaluations,
      restrictions,
      recoveryPlans,
      evidence,
      availableMissionRisk,
      remainingDailyRisk,
    });
  }

  const missionRiskViolation = authorizationRisk !== undefined && !canAllocateMissionRisk(input.allocation, authorizationRisk, input.riskUnit);
  const dailyRiskViolation = deploymentRisk !== undefined && deploymentRisk > remainingDailyRisk;
  const repeatedViolation = (input.repeatedRiskViolationCount ?? 0) >= 2;

  if (missionRiskViolation || repeatedViolation) {
    evaluations.push(evaluateGuardianRuleResult({
      rule: missionRiskRule,
      missionId: input.missionId,
      evidence,
      triggered: true,
      evaluatedAt: input.evaluatedAt,
    }));
    const plan = createGuardianRecoveryPlan({
      recoveryPlanId: `guardian-recovery:${input.missionId}:risk-reduction`,
      missionId: input.missionId,
      title: 'Reduce mission risk',
      requirements: [getRiskRecoveryRequirement(input)],
      evidenceReferences: evidence,
      status: 'pending',
      createdAt: input.evaluatedAt,
    });
    recoveryPlans.push(plan);
    restrictions.push(upsertRestriction(input, createGuardianRestriction({
      restrictionId: `guardian-restriction:${input.missionId}:mission-risk-limit`,
      ruleId: missionRiskRule.ruleId,
      missionId: input.missionId,
      blockedActions: ['request_authorization', 'approve_authorization', 'increase_risk'],
      explanation: getRiskRestrictionReason(input),
      evidenceReferences: evidence,
      startedAt: input.evaluatedAt,
      recoveryPlanId: plan.recoveryPlanId,
      status: 'active',
    })));
  }

  if (dailyRiskViolation) {
    evaluations.push(evaluateGuardianRuleResult({
      rule: dailyRiskRule,
      missionId: input.missionId,
      evidence,
      triggered: true,
      evaluatedAt: input.evaluatedAt,
    }));
    const plan = createGuardianRecoveryPlan({
      recoveryPlanId: `guardian-recovery:${input.missionId}:daily-risk`,
      missionId: input.missionId,
      title: 'Restore daily allocation',
      requirements: ['Wait until the next defined allocation period or complete Guardian review.'],
      evidenceReferences: evidence,
      status: 'pending',
      createdAt: input.evaluatedAt,
    });
    recoveryPlans.push(plan);
    restrictions.push(upsertRestriction(input, createGuardianRestriction({
      restrictionId: `guardian-restriction:${input.missionId}:daily-risk-exhausted`,
      ruleId: dailyRiskRule.ruleId,
      missionId: input.missionId,
      blockedActions: ['deploy_mission', 'continue_session'],
      explanation: 'Daily allocation is exhausted. Guardian enforces lockout until allocation or review recovers.',
      evidenceReferences: evidence,
      startedAt: input.evaluatedAt,
      recoveryPlanId: plan.recoveryPlanId,
      status: 'active',
    })));
  }

  if (restrictions.length > 0) {
    return decision(input, {
      verdict: dailyRiskViolation ? 'enforce_lockout' : 'deny_authorization',
      explanation: input.outcome === 'profitable'
        ? 'A profitable outcome does not suppress a capital protection breach.'
        : 'Guardian capital protection requires risk repair before authorization.',
      evaluations,
      restrictions,
      recoveryPlans,
      evidence,
      availableMissionRisk,
      remainingDailyRisk,
    });
  }

  evaluations.push(evaluateGuardianRuleResult({
    rule: missionRiskRule,
    missionId: input.missionId,
    evidence,
    triggered: false,
    evaluatedAt: input.evaluatedAt,
  }));

  return decision(input, {
    verdict: 'monitor',
    explanation: input.outcome === 'loss'
      ? 'Loss remained inside declared risk. Guardian records discipline without restriction.'
      : 'Risk is inside allocation. Guardian monitors without intervention.',
    evaluations,
    restrictions,
    recoveryPlans,
    evidence,
    availableMissionRisk,
    remainingDailyRisk,
  });
}

export function getAvailableMissionRisk(allocation: GuardianCapitalAllocation): number {
  return Math.max(0, allocation.allocatedRisk - allocation.reservedRisk - allocation.activeExposure);
}

export function getRemainingDailyRisk(allocation: GuardianCapitalAllocation): number {
  return Math.max(0, allocation.remainingRisk);
}

export function canAllocateMissionRisk(
  allocation: GuardianCapitalAllocation,
  requestedRisk: number,
  riskUnit: GuardianRiskUnit,
): boolean {
  if (allocation.riskUnit !== riskUnit) return false;
  return requestedRisk >= 0 && requestedRisk <= getAvailableMissionRisk(allocation) && requestedRisk <= getRemainingDailyRisk(allocation);
}

export function getRiskRestrictionReason(input: GuardianCapitalProtectionInput): string {
  const requested = input.requestedAuthorizationRisk ?? input.declaredMissionRisk ?? 0;
  return `Requested risk ${requested}${formatRiskUnit(input.riskUnit)} exceeds available mission risk ${getAvailableMissionRisk(input.allocation)}${formatRiskUnit(input.riskUnit)}.`;
}

export function getRiskRecoveryRequirement(input: GuardianCapitalProtectionInput): string {
  return `Reduce requested risk to ${getAvailableMissionRisk(input.allocation)}${formatRiskUnit(input.riskUnit)} or below.`;
}

export function reloadGuardianCapitalAllocation(allocation: GuardianCapitalAllocation): GuardianCapitalAllocation {
  return Object.freeze({
    ...allocation,
    sourceMissionIds: Object.freeze([...allocation.sourceMissionIds]),
  });
}

function decision(
  input: GuardianCapitalProtectionInput,
  values: Omit<GuardianCapitalProtectionDecision, 'allocation' | 'idempotencyKey'>,
): GuardianCapitalProtectionDecision {
  return Object.freeze({
    ...values,
    allocation: reloadGuardianCapitalAllocation(input.allocation),
    idempotencyKey: [
      input.missionId,
      values.verdict,
      input.declaredMissionRisk ?? 'missing',
      input.requestedAuthorizationRisk ?? 'none',
      input.requestedDeploymentRisk ?? 'none',
      input.allocation.lastUpdated,
    ].join(':'),
  });
}

function assertSameRiskUnit(input: GuardianCapitalProtectionInput): void {
  if (input.allocation.riskUnit !== input.riskUnit) {
    throw new Error(`Guardian cannot mix ${input.riskUnit} risk with ${input.allocation.riskUnit} allocation without conversion policy.`);
  }
}

function buildCapitalEvidence(input: GuardianCapitalProtectionInput): readonly GuardianEvidence[] {
  return Object.freeze([
    {
      evidenceId: `risk:${input.missionId}:allocation:${input.allocation.lastUpdated}`,
      source: 'guardian-capital-allocation',
      description: `Remaining risk ${input.allocation.remainingRisk}${formatRiskUnit(input.riskUnit)}.`,
      missionId: input.missionId,
      createdAt: input.evaluatedAt,
    },
    ...(input.declaredMissionRisk === undefined ? [] : [{
      evidenceId: `risk:${input.missionId}:declared:${input.declaredMissionRisk}`,
      source: 'mission-context',
      description: `Declared mission risk ${input.declaredMissionRisk}${formatRiskUnit(input.riskUnit)}.`,
      missionId: input.missionId,
      createdAt: input.evaluatedAt,
    }]),
  ]);
}

function upsertRestriction(
  input: GuardianCapitalProtectionInput,
  restriction: GuardianRestriction,
): GuardianRestriction {
  return input.existingRestrictions?.find((item) => item.restrictionId === restriction.restrictionId && item.status === 'active')
    ?? restriction;
}

function formatRiskUnit(unit: GuardianRiskUnit): string {
  if (unit === 'percentage') return '%';
  if (unit === 'R_multiple') return 'R';
  return '';
}
