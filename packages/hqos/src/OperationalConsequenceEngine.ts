import type { MissionLifecycleProjection } from './MissionLifecycleProjection';
import type { MissionEvaluation } from './MissionEvaluationEngine';
import {
  createOperationalConsequence,
  isOperationalConsequenceActive,
  type OperationalConsequence,
  type OperationalConsequenceSeverity,
} from './OperationalConsequence';

export interface OperationalConsequenceGuardianSignal {
  readonly id: string;
  readonly level: 'info' | 'caution' | 'warning' | 'lockout';
  readonly title: string;
  readonly message: string;
  readonly ruleId?: string | undefined;
  readonly evidenceReferences?: readonly { readonly id: string; readonly source: string; readonly description?: string }[] | undefined;
  readonly resolved?: boolean | undefined;
}

export interface OperationalConsequencePersistenceSignal {
  readonly id: string;
  readonly missionId: string;
  readonly failed: boolean;
  readonly message: string;
  readonly recoverable: boolean;
}

export interface OperationalConsequenceDoctrineSignal {
  readonly protectiveRuleMissing?: boolean | undefined;
  readonly pendingDoctrineReviewId?: string | undefined;
}

export interface PriorMissionPatternSignal {
  readonly type: 'premature_authorization';
  readonly sourceMissionIds: readonly string[];
}

export interface OperationalConsequenceDerivationInput {
  readonly missionId: string;
  readonly evaluatedAt: string;
  readonly missionEvaluation?: MissionEvaluation | undefined;
  readonly lifecycle?: MissionLifecycleProjection | undefined;
  readonly guardianAlerts?: readonly OperationalConsequenceGuardianSignal[] | undefined;
  readonly persistence?: OperationalConsequencePersistenceSignal | undefined;
  readonly doctrine?: OperationalConsequenceDoctrineSignal | undefined;
  readonly existingConsequences?: readonly OperationalConsequence[] | undefined;
  readonly priorMissionPatterns?: readonly PriorMissionPatternSignal[] | undefined;
  readonly financialOutcome?: 'positive' | 'negative' | 'flat' | 'unknown' | undefined;
}

export interface OperationalConsequenceDerivationResult {
  readonly candidates: readonly OperationalConsequence[];
  readonly noOpReasons: readonly string[];
}

export function deriveOperationalConsequences(
  input: OperationalConsequenceDerivationInput,
): OperationalConsequenceDerivationResult {
  const candidates = [
    ...deriveFromMissionEvaluation(input),
    ...deriveFromGuardian(input),
    ...deriveFromPersistence(input),
    ...deriveFromDoctrine(input),
    ...deriveFromPriorPatterns(input),
  ];
  const deduped = dedupeAgainstExisting(candidates, input.existingConsequences ?? []);

  return {
    candidates: deduped,
    noOpReasons: buildNoOpReasons(input, candidates, deduped),
  };
}

function deriveFromMissionEvaluation(input: OperationalConsequenceDerivationInput): readonly OperationalConsequence[] {
  const evaluation = input.missionEvaluation;
  if (evaluation === undefined) return [];

  const consequences: OperationalConsequence[] = [];
  const sourceEvaluationId = evaluation.id;
  const baseEvidence = [{ id: sourceEvaluationId, source: 'mission-evaluation' }];

  if (evaluation.verdict === 'Process Failure') {
    consequences.push(createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:process-failure:${sourceEvaluationId}`,
      missionId: input.missionId,
      category: 'process',
      type: 'recovery_confirmation_required',
      severity: 'restriction',
      title: input.financialOutcome === 'positive' ? 'Profitable process failure' : 'Process failure recorded',
      explanation: input.financialOutcome === 'positive'
        ? 'The mission result cannot override a process failure.'
        : 'Headquarters records a process failure that requires review.',
      cause: evaluation.failures[0] ?? 'Mission evaluation classified the process as failed.',
      effect: 'Future authorization should remain conservative until the failure is acknowledged.',
      evidenceReferences: baseEvidence,
      sourceEvaluationId,
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:acknowledge-process-failure`,
        description: 'Acknowledge the process failure and record the operational correction.',
        type: 'acknowledge_process_failure',
        evidenceRequired: true,
      }],
      metadata: { financialOutcome: input.financialOutcome ?? 'unknown' },
    }));
  }

  if (evaluation.failures.includes('Protective doctrine rule was not declared.')) {
    consequences.push(createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:missing-protective-rule`,
      missionId: input.missionId,
      category: 'doctrine',
      type: 'authorization_without_protective_rule',
      severity: 'restriction',
      title: 'Protective rule missing',
      explanation: 'Authorization cannot proceed cleanly without a protective doctrine rule.',
      cause: 'Mission evaluation found no protective rule at authorization.',
      effect: 'Authorization must return to Observation or declare a valid protective rule.',
      evidenceReferences: baseEvidence,
      sourceEvaluationId,
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:confirm-protective-rule`,
        description: 'Provide a valid protective rule or return to Observation.',
        type: 'confirm_protective_rule',
        evidenceRequired: true,
      }],
    }));
  }

  if (evaluation.failures.includes('Contradictions remain unresolved.')) {
    consequences.push(createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:unresolved-contradiction`,
      missionId: input.missionId,
      category: 'intelligence',
      type: 'unresolved_contradiction',
      severity: 'restriction',
      title: 'Contradiction unresolved',
      explanation: 'Mission intelligence contains unresolved contradiction evidence.',
      cause: 'Mission evaluation found contradictory evidence.',
      effect: 'Intelligence integrity is degraded until the contradiction is clarified.',
      evidenceReferences: baseEvidence,
      sourceEvaluationId,
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:clarify-contradiction`,
        description: 'Clarify or resolve the contradictory mission evidence.',
        type: 'clarify_contradiction',
        evidenceRequired: true,
      }],
    }));
  }

  if (evaluation.failures.includes('Debrief evidence is missing.') || evaluation.verdict === 'Incomplete') {
    consequences.push(createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:incomplete-debrief`,
      missionId: input.missionId,
      category: 'lifecycle',
      type: 'incomplete_debrief',
      severity: 'restriction',
      title: 'Debrief incomplete',
      explanation: 'Archive completion requires debrief evidence.',
      cause: 'Mission evaluation did not find complete debrief evidence.',
      effect: 'Mission closure should remain blocked until debrief evidence exists.',
      evidenceReferences: baseEvidence,
      sourceEvaluationId,
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:complete-debrief`,
        description: 'Complete the required behavior, discipline, and lesson debrief fields.',
        type: 'complete_debrief',
        evidenceRequired: true,
      }],
    }));
  }

  return consequences;
}

function deriveFromGuardian(input: OperationalConsequenceDerivationInput): readonly OperationalConsequence[] {
  return (input.guardianAlerts ?? [])
    .filter((alert) => alert.resolved !== true && alert.level !== 'info')
    .map((alert) => createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:guardian:${alert.id}`,
      missionId: input.missionId,
      category: 'guardian',
      type: alert.level === 'lockout' ? 'guardian_lockout' : 'guardian_warning_unresolved',
      severity: guardianSeverity(alert.level),
      title: alert.title,
      explanation: alert.message,
      cause: alert.ruleId ? `Guardian rule ${alert.ruleId} emitted ${alert.level}.` : `Guardian emitted ${alert.level}.`,
      effect: alert.level === 'lockout' ? 'Authorization and deployment are blocked.' : 'Commander guidance becomes more conservative.',
      evidenceReferences: alert.evidenceReferences ?? [{ id: alert.id, source: 'guardian' }],
      sourceGuardianAlertId: alert.id,
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:guardian:${alert.id}`,
        description: 'Review and resolve the Guardian condition.',
        type: 'review_guardian_alert',
        evidenceRequired: true,
      }],
    }));
}

function deriveFromPersistence(input: OperationalConsequenceDerivationInput): readonly OperationalConsequence[] {
  const persistence = input.persistence;
  if (persistence === undefined || !persistence.failed) return [];
  return [createOperationalConsequence({
    consequenceId: `consequence:${persistence.missionId}:persistence:${persistence.id}`,
    missionId: persistence.missionId,
    category: 'persistence',
    type: 'persistence_failure',
    severity: 'restriction',
    title: 'Persistence failure',
    explanation: persistence.message,
    cause: 'Headquarters could not confirm the mission record was secured.',
    effect: 'Archive finalization is blocked until persistence succeeds.',
    evidenceReferences: [{ id: persistence.id, source: 'persistence' }],
    createdAt: input.evaluatedAt,
    activatedAt: input.evaluatedAt,
    recoveryRequirements: [{
      requirementId: `recovery:${persistence.missionId}:retry-persistence:${persistence.id}`,
      description: 'Retry persistence until the mission record is secured.',
      type: 'retry_persistence',
      evidenceRequired: true,
    }],
    metadata: { recoverable: persistence.recoverable },
  })];
}

function deriveFromDoctrine(input: OperationalConsequenceDerivationInput): readonly OperationalConsequence[] {
  const doctrine = input.doctrine;
  if (doctrine === undefined) return [];
  const consequences: OperationalConsequence[] = [];

  if (doctrine.protectiveRuleMissing) {
    consequences.push(createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:doctrine:missing-protective-rule`,
      missionId: input.missionId,
      category: 'doctrine',
      type: 'authorization_without_protective_rule',
      severity: 'restriction',
      title: 'Doctrine protection required',
      explanation: 'Doctrine protection is required before authorization.',
      cause: 'Doctrine status reported no protective rule.',
      effect: 'Authorization is blocked until a rule is supplied.',
      evidenceReferences: [{ id: 'doctrine:protective-rule', source: 'doctrine' }],
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:doctrine:protective-rule`,
        description: 'State or select a protective doctrine rule.',
        type: 'confirm_protective_rule',
        evidenceRequired: true,
      }],
    }));
  }

  if (doctrine.pendingDoctrineReviewId) {
    consequences.push(createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:doctrine-review:${doctrine.pendingDoctrineReviewId}`,
      missionId: input.missionId,
      category: 'doctrine',
      type: 'doctrine_review_required',
      severity: 'informational',
      title: 'Doctrine review required',
      explanation: 'Mission evidence produced a doctrine review candidate.',
      cause: 'Doctrine candidate is pending review.',
      effect: 'Doctrine review is recommended but does not block the mission.',
      evidenceReferences: [{ id: doctrine.pendingDoctrineReviewId, source: 'doctrine' }],
      sourceDoctrineId: doctrine.pendingDoctrineReviewId,
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
    }));
  }

  return consequences;
}

function deriveFromPriorPatterns(input: OperationalConsequenceDerivationInput): readonly OperationalConsequence[] {
  return (input.priorMissionPatterns ?? []).flatMap((pattern) => {
    if (pattern.type !== 'premature_authorization' || pattern.sourceMissionIds.length < 2) return [];
    return [createOperationalConsequence({
      consequenceId: `consequence:${input.missionId}:pattern:premature-authorization:${pattern.sourceMissionIds.join('-')}`,
      missionId: input.missionId,
      category: 'commander',
      type: 'repeated_premature_authorization',
      severity: 'caution',
      title: 'Repeated premature authorization',
      explanation: 'Historical behavior shows repeated premature authorization attempts.',
      cause: `${pattern.sourceMissionIds.length} prior mission(s) contain premature authorization evidence.`,
      effect: 'Commander will slow authorization pacing.',
      evidenceReferences: pattern.sourceMissionIds.map((id) => ({ id, source: 'mission' })),
      createdAt: input.evaluatedAt,
      activatedAt: input.evaluatedAt,
      recoveryRequirements: [{
        requirementId: `recovery:${input.missionId}:future-adherence`,
        description: 'Demonstrate future adherence across later missions.',
        type: 'demonstrate_future_adherence',
        evidenceRequired: true,
      }],
    })];
  });
}

function dedupeAgainstExisting(
  candidates: readonly OperationalConsequence[],
  existing: readonly OperationalConsequence[],
): readonly OperationalConsequence[] {
  const existingActiveIds = new Set(existing.filter(isOperationalConsequenceActive).map((item) => item.consequenceId));
  const existingResolvedIds = new Set(existing.filter((item) => !isOperationalConsequenceActive(item)).map((item) => item.consequenceId));
  const byId = new Map<string, OperationalConsequence>();

  for (const candidate of candidates) {
    if (existingActiveIds.has(candidate.consequenceId) || existingResolvedIds.has(candidate.consequenceId)) continue;
    if (!byId.has(candidate.consequenceId)) byId.set(candidate.consequenceId, candidate);
  }

  return [...byId.values()];
}

function buildNoOpReasons(
  input: OperationalConsequenceDerivationInput,
  allCandidates: readonly OperationalConsequence[],
  dedupedCandidates: readonly OperationalConsequence[],
): readonly string[] {
  const reasons: string[] = [];
  if (allCandidates.length === 0) reasons.push('No operational consequences derived from current evidence.');
  if (allCandidates.length > dedupedCandidates.length) reasons.push('Duplicate or historical consequences were suppressed.');
  if (input.financialOutcome === 'negative' && input.missionEvaluation?.recognitionEligible) {
    reasons.push('Disciplined losing mission did not produce a negative process consequence.');
  }
  return reasons;
}

function guardianSeverity(level: OperationalConsequenceGuardianSignal['level']): OperationalConsequenceSeverity {
  if (level === 'lockout') return 'lockout';
  if (level === 'warning') return 'restriction';
  if (level === 'caution') return 'caution';
  return 'informational';
}
