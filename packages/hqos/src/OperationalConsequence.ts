export type OperationalConsequenceCategory =
  | 'process'
  | 'guardian'
  | 'intelligence'
  | 'doctrine'
  | 'academy'
  | 'commander'
  | 'persistence'
  | 'lifecycle';

export type OperationalConsequenceSeverity = 'informational' | 'caution' | 'restriction' | 'lockout';
export type OperationalConsequenceStatus = 'pending' | 'active' | 'recovering' | 'resolved' | 'expired' | 'superseded';

export type OperationalConsequenceType =
  | 'missing_required_evidence'
  | 'unresolved_contradiction'
  | 'risk_limit_violation'
  | 'authorization_without_protective_rule'
  | 'guardian_warning_unresolved'
  | 'guardian_lockout'
  | 'incomplete_debrief'
  | 'weak_debrief_evidence'
  | 'persistence_failure'
  | 'lifecycle_inconsistency'
  | 'repeated_premature_authorization'
  | 'doctrine_review_required'
  | 'recovery_confirmation_required'
  | 'disciplined_abort_acknowledged'
  | 'process_improvement_recognized';

export type RecoveryRequirementType =
  | 'provide_missing_evidence'
  | 'clarify_contradiction'
  | 'confirm_protective_rule'
  | 'complete_debrief'
  | 'review_guardian_alert'
  | 'retry_persistence'
  | 'acknowledge_process_failure'
  | 'demonstrate_future_adherence'
  | 'resume_recovered_mission';

export type RecoveryRequirementCompletionState = 'pending' | 'satisfied' | 'rejected' | 'not_applicable';

export interface OperationalEvidenceReference {
  readonly id: string;
  readonly source: string;
  readonly description?: string | undefined;
}

export interface RecoveryRequirementInput {
  readonly requirementId: string;
  readonly description: string;
  readonly type: RecoveryRequirementType;
  readonly completionState?: RecoveryRequirementCompletionState | undefined;
  readonly evidenceRequired: boolean;
  readonly completedAt?: string | undefined;
  readonly evidenceReferences?: readonly OperationalEvidenceReference[] | undefined;
}

export interface RecoveryRequirement {
  readonly requirementId: string;
  readonly description: string;
  readonly type: RecoveryRequirementType;
  readonly completionState: RecoveryRequirementCompletionState;
  readonly evidenceRequired: boolean;
  readonly completedAt?: string | undefined;
  readonly evidenceReferences: readonly OperationalEvidenceReference[];
}

export interface OperationalConsequenceInput {
  readonly consequenceId: string;
  readonly missionId: string;
  readonly operatorId?: string | undefined;
  readonly category: OperationalConsequenceCategory;
  readonly type: OperationalConsequenceType;
  readonly severity: OperationalConsequenceSeverity;
  readonly status?: OperationalConsequenceStatus | undefined;
  readonly title: string;
  readonly explanation: string;
  readonly cause: string;
  readonly effect: string;
  readonly evidenceReferences: readonly OperationalEvidenceReference[];
  readonly sourceEvaluationId?: string | undefined;
  readonly sourceGuardianAlertId?: string | undefined;
  readonly sourceDoctrineId?: string | undefined;
  readonly createdAt: string;
  readonly activatedAt?: string | undefined;
  readonly resolvedAt?: string | undefined;
  readonly expiresAt?: string | undefined;
  readonly recoveryRequirements?: readonly RecoveryRequirementInput[] | undefined;
  readonly resolutionEvidence?: readonly OperationalEvidenceReference[] | undefined;
  readonly supersededBy?: string | undefined;
  readonly metadata?: Readonly<Record<string, string | number | boolean>> | undefined;
}

export interface OperationalConsequence {
  readonly consequenceId: string;
  readonly missionId: string;
  readonly operatorId?: string | undefined;
  readonly category: OperationalConsequenceCategory;
  readonly type: OperationalConsequenceType;
  readonly severity: OperationalConsequenceSeverity;
  readonly status: OperationalConsequenceStatus;
  readonly title: string;
  readonly explanation: string;
  readonly cause: string;
  readonly effect: string;
  readonly evidenceReferences: readonly OperationalEvidenceReference[];
  readonly sourceEvaluationId?: string | undefined;
  readonly sourceGuardianAlertId?: string | undefined;
  readonly sourceDoctrineId?: string | undefined;
  readonly createdAt: string;
  readonly activatedAt?: string | undefined;
  readonly resolvedAt?: string | undefined;
  readonly expiresAt?: string | undefined;
  readonly recoveryRequirements: readonly RecoveryRequirement[];
  readonly resolutionEvidence: readonly OperationalEvidenceReference[];
  readonly supersededBy?: string | undefined;
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
}

export class OperationalConsequenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationalConsequenceError';
  }
}

const activeStatuses: readonly OperationalConsequenceStatus[] = ['pending', 'active', 'recovering'];
const blockingSeverities: readonly OperationalConsequenceSeverity[] = ['restriction', 'lockout'];

export function createOperationalConsequence(input: OperationalConsequenceInput): OperationalConsequence {
  if (!input.consequenceId.trim()) {
    throw new OperationalConsequenceError('Operational consequence requires a stable consequenceId.');
  }
  if (!input.missionId.trim()) {
    throw new OperationalConsequenceError('Operational consequence requires a missionId.');
  }
  if (hasDuplicateRequirementIds(input.recoveryRequirements ?? [])) {
    throw new OperationalConsequenceError(`Operational consequence ${input.consequenceId} has duplicate recovery requirement identifiers.`);
  }

  return freezeConsequence({
    consequenceId: input.consequenceId,
    missionId: input.missionId,
    ...(input.operatorId ? { operatorId: input.operatorId } : {}),
    category: input.category,
    type: input.type,
    severity: input.severity,
    status: input.status ?? 'active',
    title: input.title,
    explanation: input.explanation,
    cause: input.cause,
    effect: input.effect,
    evidenceReferences: cloneEvidence(input.evidenceReferences),
    ...(input.sourceEvaluationId ? { sourceEvaluationId: input.sourceEvaluationId } : {}),
    ...(input.sourceGuardianAlertId ? { sourceGuardianAlertId: input.sourceGuardianAlertId } : {}),
    ...(input.sourceDoctrineId ? { sourceDoctrineId: input.sourceDoctrineId } : {}),
    createdAt: input.createdAt,
    ...(input.activatedAt ? { activatedAt: input.activatedAt } : {}),
    ...(input.resolvedAt ? { resolvedAt: input.resolvedAt } : {}),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    recoveryRequirements: (input.recoveryRequirements ?? []).map(normalizeRecoveryRequirement),
    resolutionEvidence: cloneEvidence(input.resolutionEvidence ?? []),
    ...(input.supersededBy ? { supersededBy: input.supersededBy } : {}),
    metadata: { ...(input.metadata ?? {}) },
  });
}

export function isOperationalConsequenceActive(consequence: OperationalConsequence): boolean {
  return activeStatuses.includes(consequence.status);
}

export function isOperationalConsequenceBlocking(consequence: OperationalConsequence): boolean {
  return isOperationalConsequenceActive(consequence) && blockingSeverities.includes(consequence.severity);
}

export function getOutstandingRecoveryRequirements(
  consequence: OperationalConsequence,
): readonly RecoveryRequirement[] {
  return Object.freeze(consequence.recoveryRequirements
    .filter((requirement) => requirement.completionState === 'pending')
    .map(cloneRecoveryRequirement));
}

export function canResolveOperationalConsequence(consequence: OperationalConsequence): boolean {
  return isOperationalConsequenceActive(consequence)
    && getOutstandingRecoveryRequirements(consequence).length === 0;
}

export function resolveOperationalConsequence(
  consequence: OperationalConsequence,
  input: {
    readonly resolvedAt: string;
    readonly resolutionEvidence: readonly OperationalEvidenceReference[];
  },
): OperationalConsequence {
  if (!canResolveOperationalConsequence(consequence)) {
    throw new OperationalConsequenceError(`Operational consequence ${consequence.consequenceId} cannot be resolved until recovery requirements are satisfied.`);
  }

  return freezeConsequence({
    ...cloneConsequence(consequence),
    status: 'resolved',
    resolvedAt: input.resolvedAt,
    resolutionEvidence: cloneEvidence(input.resolutionEvidence),
  });
}

export function supersedeOperationalConsequence(
  consequence: OperationalConsequence,
  input: {
    readonly supersededBy: string;
    readonly resolvedAt: string;
  },
): OperationalConsequence {
  if (!input.supersededBy.trim()) {
    throw new OperationalConsequenceError('Superseding consequence id is required.');
  }

  return freezeConsequence({
    ...cloneConsequence(consequence),
    status: 'superseded',
    resolvedAt: input.resolvedAt,
    supersededBy: input.supersededBy,
  });
}

export function completeRecoveryRequirement(
  consequence: OperationalConsequence,
  input: {
    readonly requirementId: string;
    readonly completedAt: string;
    readonly evidenceReferences?: readonly OperationalEvidenceReference[] | undefined;
  },
): OperationalConsequence {
  const requirement = consequence.recoveryRequirements.find((item) => item.requirementId === input.requirementId);
  if (requirement === undefined) {
    throw new OperationalConsequenceError(`Recovery requirement ${input.requirementId} does not exist on ${consequence.consequenceId}.`);
  }
  if (requirement.evidenceRequired && (input.evidenceReferences ?? []).length === 0) {
    throw new OperationalConsequenceError(`Recovery requirement ${input.requirementId} requires evidence.`);
  }

  const recoveryRequirements = consequence.recoveryRequirements.map((item) => (
    item.requirementId === input.requirementId
      ? freezeRecoveryRequirement({
          ...cloneRecoveryRequirement(item),
          completionState: 'satisfied',
          completedAt: input.completedAt,
          evidenceReferences: cloneEvidence(input.evidenceReferences ?? item.evidenceReferences),
        })
      : cloneRecoveryRequirement(item)
  ));

  return freezeConsequence({
    ...cloneConsequence(consequence),
    status: recoveryRequirements.some((item) => item.completionState === 'pending') ? 'recovering' : consequence.status,
    recoveryRequirements,
  });
}

export function upsertOperationalConsequence(
  consequences: readonly OperationalConsequence[],
  consequence: OperationalConsequence,
): readonly OperationalConsequence[] {
  const existingIndex = consequences.findIndex((item) => item.consequenceId === consequence.consequenceId);
  if (existingIndex === -1) return [...consequences.map(cloneConsequence), cloneConsequence(consequence)];

  return consequences.map((item, index) => (
    index === existingIndex ? cloneConsequence(consequence) : cloneConsequence(item)
  ));
}

function normalizeRecoveryRequirement(input: RecoveryRequirementInput): RecoveryRequirement {
  if (!input.requirementId.trim()) {
    throw new OperationalConsequenceError('Recovery requirement requires a stable requirementId.');
  }
  return freezeRecoveryRequirement({
    requirementId: input.requirementId,
    description: input.description,
    type: input.type,
    completionState: input.completionState ?? 'pending',
    evidenceRequired: input.evidenceRequired,
    ...(input.completedAt ? { completedAt: input.completedAt } : {}),
    evidenceReferences: cloneEvidence(input.evidenceReferences ?? []),
  });
}

function hasDuplicateRequirementIds(requirements: readonly RecoveryRequirementInput[]): boolean {
  return new Set(requirements.map((requirement) => requirement.requirementId)).size !== requirements.length;
}

function cloneConsequence(consequence: OperationalConsequence): OperationalConsequence {
  return freezeConsequence({
    ...consequence,
    evidenceReferences: cloneEvidence(consequence.evidenceReferences),
    recoveryRequirements: consequence.recoveryRequirements.map(cloneRecoveryRequirement),
    resolutionEvidence: cloneEvidence(consequence.resolutionEvidence),
    metadata: { ...consequence.metadata },
  });
}

function cloneRecoveryRequirement(requirement: RecoveryRequirement): RecoveryRequirement {
  return freezeRecoveryRequirement({
    ...requirement,
    evidenceReferences: cloneEvidence(requirement.evidenceReferences),
  });
}

function cloneEvidence(evidenceReferences: readonly OperationalEvidenceReference[]): readonly OperationalEvidenceReference[] {
  return Object.freeze(evidenceReferences.map((reference) => Object.freeze({ ...reference })));
}

function freezeRecoveryRequirement(requirement: RecoveryRequirement): RecoveryRequirement {
  return Object.freeze({
    ...requirement,
    evidenceReferences: cloneEvidence(requirement.evidenceReferences),
  });
}

function freezeConsequence(consequence: OperationalConsequence): OperationalConsequence {
  return Object.freeze({
    ...consequence,
    evidenceReferences: cloneEvidence(consequence.evidenceReferences),
    recoveryRequirements: Object.freeze(consequence.recoveryRequirements.map(freezeRecoveryRequirement)),
    resolutionEvidence: cloneEvidence(consequence.resolutionEvidence),
    metadata: Object.freeze({ ...consequence.metadata }),
  });
}
