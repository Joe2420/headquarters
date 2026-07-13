import type { GuardianBlockedAction, GuardianEvidence, GuardianRecoveryPlan, GuardianSeverity } from './GuardianProtection';

export type GuardianInterventionState =
  | 'proposed'
  | 'active'
  | 'acknowledged'
  | 'recovery_required'
  | 'recovery_in_progress'
  | 'resolved'
  | 'expired'
  | 'superseded';

export type GuardianInterventionType =
  | 'caution'
  | 'authorization_hold'
  | 'deployment_suspension'
  | 'return_to_base_recommendation'
  | 'mission_lockout'
  | 'session_lockout'
  | 'persistence_hold'
  | 'recovery_review';

export interface GuardianInterventionRecord {
  readonly interventionId: string;
  readonly missionId?: string;
  readonly type: GuardianInterventionType;
  readonly state: GuardianInterventionState;
  readonly ruleIds: readonly string[];
  readonly severity: GuardianSeverity;
  readonly title: string;
  readonly explanation: string;
  readonly blockedActions: readonly GuardianBlockedAction[];
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly createdAt: string;
  readonly acknowledgedAt?: string;
  readonly recoveryPlanId?: string;
  readonly recoveryEvidence: readonly GuardianEvidence[];
  readonly resolvedAt?: string;
  readonly resolutionReason?: string;
  readonly returnContext?: string;
}

export interface GuardianInterventionServiceState {
  readonly interventions: readonly GuardianInterventionRecord[];
  readonly recoveryPlans: readonly GuardianRecoveryPlan[];
}

export class GuardianInterventionService {
  private readonly interventions: Map<string, GuardianInterventionRecord>;
  private readonly recoveryPlans: Map<string, GuardianRecoveryPlan>;

  constructor(state?: GuardianInterventionServiceState) {
    this.interventions = new Map((state?.interventions ?? []).map((item) => [item.interventionId, freezeIntervention(item)]));
    this.recoveryPlans = new Map((state?.recoveryPlans ?? []).map((item) => [item.recoveryPlanId, freezePlan(item)]));
  }

  startIntervention(input: Omit<GuardianInterventionRecord, 'state' | 'recoveryEvidence'> & {
    readonly state?: GuardianInterventionState;
    readonly recoveryPlan?: GuardianRecoveryPlan;
  }): GuardianInterventionRecord {
    const existing = this.interventions.get(input.interventionId);
    if (existing !== undefined && isActiveState(existing.state)) return existing;
    if ((input.type === 'mission_lockout' || input.type === 'session_lockout') && !input.recoveryPlanId && !input.recoveryPlan) {
      throw new Error('Guardian lockout interventions require a recovery plan.');
    }
    if (input.type === 'caution' && input.blockedActions.length > 0) {
      throw new Error('Guardian caution may not block actions.');
    }
    if (input.recoveryPlan) this.recoveryPlans.set(input.recoveryPlan.recoveryPlanId, freezePlan(input.recoveryPlan));

    const record = freezeIntervention({
      ...input,
      state: input.state ?? 'active',
      recoveryEvidence: [],
      ...(input.recoveryPlan ? { recoveryPlanId: input.recoveryPlan.recoveryPlanId } : input.recoveryPlanId ? { recoveryPlanId: input.recoveryPlanId } : {}),
    });
    this.interventions.set(record.interventionId, record);
    return record;
  }

  acknowledgeIntervention(interventionId: string, acknowledgedAt: string): GuardianInterventionRecord {
    const intervention = this.requireIntervention(interventionId);
    if (intervention.state === 'resolved') return intervention;
    return this.update(interventionId, {
      ...intervention,
      state: 'acknowledged',
      acknowledgedAt,
    });
  }

  beginRecovery(interventionId: string): GuardianInterventionRecord {
    const intervention = this.requireIntervention(interventionId);
    if (!intervention.recoveryPlanId) throw new Error('Guardian recovery requires a recovery plan.');
    return this.update(interventionId, {
      ...intervention,
      state: 'recovery_in_progress',
    });
  }

  recordRecoveryEvidence(interventionId: string, evidence: GuardianEvidence): GuardianInterventionRecord {
    const intervention = this.requireIntervention(interventionId);
    if (!intervention.recoveryPlanId) throw new Error('Recovery evidence cannot be recorded without a recovery plan.');
    const byId = new Map(intervention.recoveryEvidence.map((item) => [item.evidenceId, item]));
    byId.set(evidence.evidenceId, evidence);
    return this.update(interventionId, {
      ...intervention,
      state: 'recovery_in_progress',
      recoveryEvidence: [...byId.values()],
    });
  }

  resolveIntervention(interventionId: string, input: { readonly resolvedAt: string; readonly resolutionReason: string }): GuardianInterventionRecord {
    const intervention = this.requireIntervention(interventionId);
    if (intervention.recoveryPlanId && intervention.recoveryEvidence.length === 0) {
      throw new Error('Guardian intervention cannot resolve until valid recovery evidence is recorded.');
    }
    return this.update(interventionId, {
      ...intervention,
      state: 'resolved',
      resolvedAt: input.resolvedAt,
      resolutionReason: input.resolutionReason,
    });
  }

  supersedeIntervention(interventionId: string, input: { readonly resolvedAt: string; readonly supersededBy: string }): GuardianInterventionRecord {
    const intervention = this.requireIntervention(interventionId);
    return this.update(interventionId, {
      ...intervention,
      state: 'superseded',
      resolvedAt: input.resolvedAt,
      resolutionReason: `Superseded by ${input.supersededBy}.`,
    });
  }

  listActiveInterventions(): readonly GuardianInterventionRecord[] {
    return Object.freeze([...this.interventions.values()].filter((item) => isActiveState(item.state)).map(freezeIntervention));
  }

  listHistoricalInterventions(): readonly GuardianInterventionRecord[] {
    return Object.freeze([...this.interventions.values()].map(freezeIntervention));
  }

  getHighestPriorityIntervention(): GuardianInterventionRecord | undefined {
    return [...this.listActiveInterventions()].sort(compareInterventions)[0];
  }

  dumpState(): GuardianInterventionServiceState {
    return Object.freeze({
      interventions: this.listHistoricalInterventions(),
      recoveryPlans: Object.freeze([...this.recoveryPlans.values()].map(freezePlan)),
    });
  }

  private requireIntervention(interventionId: string): GuardianInterventionRecord {
    const intervention = this.interventions.get(interventionId);
    if (intervention === undefined) throw new Error(`Guardian intervention ${interventionId} does not exist.`);
    return intervention;
  }

  private update(interventionId: string, intervention: GuardianInterventionRecord): GuardianInterventionRecord {
    const frozen = freezeIntervention(intervention);
    this.interventions.set(interventionId, frozen);
    return frozen;
  }
}

function isActiveState(state: GuardianInterventionState): boolean {
  return state === 'proposed'
    || state === 'active'
    || state === 'acknowledged'
    || state === 'recovery_required'
    || state === 'recovery_in_progress';
}

function compareInterventions(left: GuardianInterventionRecord, right: GuardianInterventionRecord): number {
  return severityRank(right.severity) - severityRank(left.severity)
    || left.createdAt.localeCompare(right.createdAt)
    || left.interventionId.localeCompare(right.interventionId);
}

function severityRank(severity: GuardianSeverity): number {
  if (severity === 'lockout') return 4;
  if (severity === 'restriction') return 3;
  if (severity === 'warning') return 2;
  if (severity === 'caution') return 1;
  return 0;
}

function freezeIntervention(intervention: GuardianInterventionRecord): GuardianInterventionRecord {
  return Object.freeze({
    ...intervention,
    ruleIds: Object.freeze([...intervention.ruleIds]),
    blockedActions: Object.freeze([...intervention.blockedActions]),
    evidenceReferences: Object.freeze(intervention.evidenceReferences.map((item) => Object.freeze({ ...item }))),
    recoveryEvidence: Object.freeze(intervention.recoveryEvidence.map((item) => Object.freeze({ ...item }))),
  });
}

function freezePlan(plan: GuardianRecoveryPlan): GuardianRecoveryPlan {
  return Object.freeze({
    ...plan,
    requirements: Object.freeze([...plan.requirements]),
    evidenceReferences: Object.freeze(plan.evidenceReferences.map((item) => Object.freeze({ ...item }))),
  });
}
