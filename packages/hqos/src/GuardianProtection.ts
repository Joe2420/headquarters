export type GuardianProtectionState =
  | 'secure'
  | 'observing'
  | 'caution'
  | 'warning'
  | 'restriction'
  | 'lockout'
  | 'recovery'
  | 'restored';

export type GuardianVerdict =
  | 'no_action'
  | 'monitor'
  | 'caution_operator'
  | 'require_clarification'
  | 'restrict_authorization'
  | 'deny_authorization'
  | 'suspend_deployment'
  | 'recommend_return_to_base'
  | 'enforce_lockout'
  | 'begin_recovery'
  | 'confirm_recovery';

export type GuardianRuleCategory =
  | 'capital'
  | 'risk'
  | 'lifecycle'
  | 'authorization'
  | 'behavior'
  | 'recovery'
  | 'persistence'
  | 'Doctrine'
  | 'session'
  | 'judgment';

export type GuardianSeverity = 'notice' | 'caution' | 'warning' | 'restriction' | 'lockout';
export type GuardianRuleEvaluationResult = 'not_evaluated' | 'clear' | 'triggered' | 'missing_evidence' | 'disabled';
export type GuardianRestrictionStatus = 'active' | 'resolved' | 'expired' | 'superseded';
export type GuardianBlockedAction =
  | 'request_authorization'
  | 'approve_authorization'
  | 'deploy_mission'
  | 'archive_mission'
  | 'increase_risk'
  | 'continue_session'
  | 'finalize_persistence';

export interface GuardianEvidence {
  readonly evidenceId: string;
  readonly source: string;
  readonly description: string;
  readonly missionId?: string;
  readonly createdAt?: string;
}

export interface GuardianRecoveryPlan {
  readonly recoveryPlanId: string;
  readonly missionId?: string;
  readonly title: string;
  readonly requirements: readonly string[];
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly status: 'pending' | 'in_progress' | 'complete' | 'superseded';
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface GuardianRule {
  readonly ruleId: string;
  readonly title: string;
  readonly description: string;
  readonly category: GuardianRuleCategory;
  readonly severity: GuardianSeverity;
  readonly triggerCondition: string;
  readonly evidenceRequirements: readonly string[];
  readonly operationalEffect: string;
  readonly recoveryPolicy: string;
  readonly relatedDoctrineIds: readonly string[];
  readonly enabled: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GuardianRuleEvaluation {
  readonly evaluationId: string;
  readonly ruleId: string;
  readonly missionId?: string;
  readonly result: GuardianRuleEvaluationResult;
  readonly state: GuardianProtectionState;
  readonly explanation: string;
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly missingEvidence: readonly string[];
  readonly triggeredAt?: string;
  readonly clearedAt?: string;
  readonly sourceRevision: string;
}

export interface GuardianRestriction {
  readonly restrictionId: string;
  readonly ruleId: string;
  readonly missionId?: string;
  readonly blockedActions: readonly GuardianBlockedAction[];
  readonly explanation: string;
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly startedAt: string;
  readonly expiresAt?: string;
  readonly recoveryPlanId?: string;
  readonly status: GuardianRestrictionStatus;
}

export interface GuardianIntervention {
  readonly interventionId: string;
  readonly missionId?: string;
  readonly verdict: GuardianVerdict;
  readonly severity: GuardianSeverity;
  readonly title: string;
  readonly explanation: string;
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly restrictionIds: readonly string[];
  readonly createdAt: string;
}

export interface GuardianJudgmentReserve {
  readonly state: 'full' | 'stable' | 'reduced' | 'strained' | 'depleted' | 'recovering';
  readonly explanation: string;
  readonly supportingEvidence: readonly GuardianEvidence[];
  readonly degradingFactors: readonly string[];
  readonly improvingFactors: readonly string[];
  readonly lastUpdated: string;
  readonly recommendedAction: string;
  readonly blockingEffect: GuardianVerdict | 'none';
  readonly trend: 'improving' | 'stable' | 'declining' | 'recovering';
}

export interface GuardianCapitalAllocation {
  readonly missionRiskLimit?: string;
  readonly dailyRiskLimit?: string;
  readonly weeklyRiskLimit?: string;
  readonly allocatedRisk: number;
  readonly consumedRisk: number;
  readonly remainingRisk: number;
  readonly reservedRisk: number;
  readonly activeExposure: number;
  readonly riskUnit: 'currency' | 'percentage' | 'R_multiple';
  readonly sourceMissionIds: readonly string[];
  readonly lastUpdated: string;
}

export interface GuardianProtectionHistory {
  readonly evaluations: readonly GuardianRuleEvaluation[];
  readonly restrictions: readonly GuardianRestriction[];
  readonly interventions: readonly GuardianIntervention[];
  readonly recoveryPlans: readonly GuardianRecoveryPlan[];
}

export interface GuardianProtectionSnapshot {
  readonly snapshotId: string;
  readonly missionId?: string;
  readonly state: GuardianProtectionState;
  readonly verdict: GuardianVerdict;
  readonly explanation: string;
  readonly evaluations: readonly GuardianRuleEvaluation[];
  readonly activeRestrictions: readonly GuardianRestriction[];
  readonly interventions: readonly GuardianIntervention[];
  readonly recoveryPlans: readonly GuardianRecoveryPlan[];
  readonly judgmentReserve?: GuardianJudgmentReserve;
  readonly capitalAllocation?: GuardianCapitalAllocation;
  readonly history: GuardianProtectionHistory;
  readonly evaluatedAt: string;
}

export class GuardianProtectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardianProtectionError';
  }
}

const severityRank: Record<GuardianSeverity, number> = {
  notice: 0,
  caution: 1,
  warning: 2,
  restriction: 3,
  lockout: 4,
};

export function createGuardianRule(input: GuardianRule): GuardianRule {
  if (!input.ruleId.trim()) throw new GuardianProtectionError('Guardian rule requires a ruleId.');
  if (input.evidenceRequirements.length === 0) {
    throw new GuardianProtectionError(`Guardian rule ${input.ruleId} requires evidence requirements.`);
  }
  return freezeRule(input);
}

export function evaluateGuardianRuleResult(input: {
  readonly rule: GuardianRule;
  readonly missionId?: string;
  readonly evidence: readonly GuardianEvidence[];
  readonly missingEvidence?: readonly string[];
  readonly triggered: boolean;
  readonly evaluatedAt: string;
  readonly sourceRevision?: string;
}): GuardianRuleEvaluation {
  if (!input.rule.enabled) {
    return freezeEvaluation({
      evaluationId: `guardian-evaluation:${input.rule.ruleId}:disabled:${input.sourceRevision ?? input.rule.version}`,
      ruleId: input.rule.ruleId,
      ...(input.missionId ? { missionId: input.missionId } : {}),
      result: 'disabled',
      state: 'secure',
      explanation: `Guardian rule ${input.rule.title} is disabled.`,
      evidenceReferences: [],
      missingEvidence: [],
      sourceRevision: input.sourceRevision ?? String(input.rule.version),
    });
  }

  if (input.triggered && input.evidence.length === 0) {
    throw new GuardianProtectionError(`Guardian rule ${input.rule.ruleId} cannot trigger without evidence.`);
  }

  const missingEvidence = input.missingEvidence ?? [];
  const result: GuardianRuleEvaluationResult = missingEvidence.length > 0
    ? 'missing_evidence'
    : input.triggered
      ? 'triggered'
      : 'clear';

  return freezeEvaluation({
    evaluationId: stableGuardianId([
      'guardian-evaluation',
      input.rule.ruleId,
      input.missionId ?? 'global',
      result,
      input.sourceRevision ?? String(input.rule.version),
      ...input.evidence.map((item) => item.evidenceId),
      ...missingEvidence,
    ]),
    ruleId: input.rule.ruleId,
    ...(input.missionId ? { missionId: input.missionId } : {}),
    result,
    state: result === 'triggered' ? stateForSeverity(input.rule.severity) : result === 'missing_evidence' ? 'caution' : 'secure',
    explanation: result === 'triggered'
      ? input.rule.operationalEffect
      : result === 'missing_evidence'
        ? `Guardian requires evidence: ${missingEvidence.join(', ')}.`
        : `Guardian rule ${input.rule.title} is clear.`,
    evidenceReferences: input.evidence,
    missingEvidence,
    ...(result === 'triggered' ? { triggeredAt: input.evaluatedAt } : { clearedAt: input.evaluatedAt }),
    sourceRevision: input.sourceRevision ?? String(input.rule.version),
  });
}

export function createGuardianRestriction(input: GuardianRestriction): GuardianRestriction {
  if (!input.ruleId.trim()) throw new GuardianProtectionError('Guardian restriction must reference a rule.');
  if (input.blockedActions.length === 0) {
    throw new GuardianProtectionError('Guardian restriction must block at least one supported action.');
  }
  if (new Set(input.blockedActions).size !== input.blockedActions.length) {
    throw new GuardianProtectionError('Guardian restriction contains duplicate blocked actions.');
  }
  if (input.evidenceReferences.length === 0) {
    throw new GuardianProtectionError('Guardian restriction must reference evidence.');
  }
  return freezeRestriction(input);
}

export function isGuardianRestrictionActive(restriction: GuardianRestriction): boolean {
  return restriction.status === 'active';
}

export function isGuardianActionBlocked(
  restrictions: readonly GuardianRestriction[],
  action: GuardianBlockedAction,
): boolean {
  return getGuardianBlockedActions(restrictions).includes(action);
}

export function getGuardianBlockedActions(restrictions: readonly GuardianRestriction[]): readonly GuardianBlockedAction[] {
  return Object.freeze([...new Set(restrictions
    .filter(isGuardianRestrictionActive)
    .flatMap((restriction) => restriction.blockedActions))].sort());
}

export function getGuardianHighestSeverity(values: readonly GuardianSeverity[]): GuardianSeverity {
  return [...values].sort((left, right) => severityRank[right] - severityRank[left] || left.localeCompare(right))[0] ?? 'notice';
}

export function getGuardianRecoveryPlan(
  plans: readonly GuardianRecoveryPlan[],
  recoveryPlanId: string | undefined,
): GuardianRecoveryPlan | undefined {
  if (!recoveryPlanId) return undefined;
  const plan = plans.find((item) => item.recoveryPlanId === recoveryPlanId);
  return plan ? freezeRecoveryPlan(plan) : undefined;
}

export function resolveGuardianRestriction(
  restriction: GuardianRestriction,
  input: { readonly resolvedAt: string },
): GuardianRestriction {
  return freezeRestriction({
    ...restriction,
    status: 'resolved',
    expiresAt: input.resolvedAt,
  });
}

export function supersedeGuardianRuleEvaluation(
  evaluation: GuardianRuleEvaluation,
  input: { readonly clearedAt: string; readonly sourceRevision: string },
): GuardianRuleEvaluation {
  return freezeEvaluation({
    ...evaluation,
    result: 'clear',
    state: 'restored',
    explanation: `${evaluation.explanation} Superseded by revision ${input.sourceRevision}.`,
    clearedAt: input.clearedAt,
    sourceRevision: input.sourceRevision,
  });
}

export function upsertGuardianRuleEvaluation(
  evaluations: readonly GuardianRuleEvaluation[],
  evaluation: GuardianRuleEvaluation,
): readonly GuardianRuleEvaluation[] {
  const byId = new Map(evaluations.map((item) => [item.evaluationId, item]));
  byId.set(evaluation.evaluationId, evaluation);
  return Object.freeze([...byId.values()].map(freezeEvaluation));
}

export function createGuardianRecoveryPlan(input: GuardianRecoveryPlan): GuardianRecoveryPlan {
  if (!input.recoveryPlanId.trim()) throw new GuardianProtectionError('Guardian recovery plan requires an id.');
  if (input.requirements.length === 0) throw new GuardianProtectionError('Guardian recovery plan requires at least one requirement.');
  return freezeRecoveryPlan(input);
}

export function createGuardianProtectionSnapshot(input: GuardianProtectionSnapshot): GuardianProtectionSnapshot {
  return Object.freeze({
    ...input,
    evaluations: Object.freeze(input.evaluations.map(freezeEvaluation)),
    activeRestrictions: Object.freeze(input.activeRestrictions.map(freezeRestriction)),
    interventions: Object.freeze(input.interventions.map(freezeIntervention)),
    recoveryPlans: Object.freeze(input.recoveryPlans.map(freezeRecoveryPlan)),
    history: Object.freeze({
      evaluations: Object.freeze(input.history.evaluations.map(freezeEvaluation)),
      restrictions: Object.freeze(input.history.restrictions.map(freezeRestriction)),
      interventions: Object.freeze(input.history.interventions.map(freezeIntervention)),
      recoveryPlans: Object.freeze(input.history.recoveryPlans.map(freezeRecoveryPlan)),
    }),
  });
}

export function stableGuardianId(parts: readonly string[]): string {
  return parts
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9:_-]+/gu, '-').replace(/^-|-$/gu, ''))
    .filter(Boolean)
    .join(':');
}

function stateForSeverity(severity: GuardianSeverity): GuardianProtectionState {
  if (severity === 'lockout') return 'lockout';
  if (severity === 'restriction') return 'restriction';
  if (severity === 'warning') return 'warning';
  if (severity === 'caution') return 'caution';
  return 'observing';
}

function freezeEvidence(evidence: GuardianEvidence): GuardianEvidence {
  return Object.freeze({ ...evidence });
}

function freezeRule(rule: GuardianRule): GuardianRule {
  return Object.freeze({
    ...rule,
    evidenceRequirements: Object.freeze([...rule.evidenceRequirements]),
    relatedDoctrineIds: Object.freeze([...rule.relatedDoctrineIds]),
  });
}

function freezeEvaluation(evaluation: GuardianRuleEvaluation): GuardianRuleEvaluation {
  return Object.freeze({
    ...evaluation,
    evidenceReferences: Object.freeze(evaluation.evidenceReferences.map(freezeEvidence)),
    missingEvidence: Object.freeze([...evaluation.missingEvidence]),
  });
}

function freezeRestriction(restriction: GuardianRestriction): GuardianRestriction {
  return Object.freeze({
    ...restriction,
    blockedActions: Object.freeze([...restriction.blockedActions]),
    evidenceReferences: Object.freeze(restriction.evidenceReferences.map(freezeEvidence)),
  });
}

function freezeRecoveryPlan(plan: GuardianRecoveryPlan): GuardianRecoveryPlan {
  return Object.freeze({
    ...plan,
    requirements: Object.freeze([...plan.requirements]),
    evidenceReferences: Object.freeze(plan.evidenceReferences.map(freezeEvidence)),
  });
}

function freezeIntervention(intervention: GuardianIntervention): GuardianIntervention {
  return Object.freeze({
    ...intervention,
    evidenceReferences: Object.freeze(intervention.evidenceReferences.map(freezeEvidence)),
    restrictionIds: Object.freeze([...intervention.restrictionIds]),
  });
}
