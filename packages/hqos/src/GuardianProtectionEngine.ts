import type { MissionLifecycleProjection } from './MissionLifecycleProjection';
import type { MissionEvaluation } from './MissionEvaluationEngine';
import type { OperationalConsequence } from './OperationalConsequence';
import { isOperationalConsequenceBlocking } from './OperationalConsequence';
import type { InstitutionalHealthSnapshot } from './InstitutionalHealth';
import type { RelationshipSnapshot } from './CommanderRelationship';
import type { HeadquartersIntelligenceInsight } from './HeadquartersIntelligenceInsightEngine';
import type { GuardianCapitalProtectionDecision } from './GuardianCapitalProtection';
import type { GuardianSuccessProtocolDecision } from './GuardianSuccessProtocol';
import type {
  GuardianBlockedAction,
  GuardianEvidence,
  GuardianIntervention,
  GuardianJudgmentReserve,
  GuardianProtectionState,
  GuardianRecoveryPlan,
  GuardianRestriction,
  GuardianRuleEvaluation,
  GuardianSeverity,
  GuardianVerdict,
} from './GuardianProtection';
import { getGuardianBlockedActions, getGuardianHighestSeverity } from './GuardianProtection';

export interface GuardianProtectionEngineInput {
  readonly missionId: string;
  readonly evaluatedAt: string;
  readonly lifecycle: MissionLifecycleProjection;
  readonly missionContext?: {
    readonly missionObjective?: string;
    readonly riskLimit?: string;
    readonly operatorCondition?: string;
    readonly observationComplete?: boolean;
    readonly authorizationReasoning?: string;
    readonly protectiveRule?: string;
    readonly materialChangeReported?: boolean;
    readonly planValid?: boolean;
    readonly debriefComplete?: boolean;
  };
  readonly missionEvaluation?: MissionEvaluation;
  readonly operationalConsequences?: readonly OperationalConsequence[];
  readonly institutionalHealth?: InstitutionalHealthSnapshot;
  readonly commanderRelationship?: RelationshipSnapshot;
  readonly intelligenceInsights?: readonly HeadquartersIntelligenceInsight[];
  readonly capitalProtection?: GuardianCapitalProtectionDecision;
  readonly judgmentReserve?: GuardianJudgmentReserve;
  readonly successProtocol?: GuardianSuccessProtocolDecision;
  readonly deployedCheckIns?: readonly { readonly status: string; readonly createdAt: string }[];
  readonly existingEvaluations?: readonly GuardianRuleEvaluation[];
  readonly existingRestrictions?: readonly GuardianRestriction[];
}

export interface GuardianProtectionDecision {
  readonly state: GuardianProtectionState;
  readonly verdict: GuardianVerdict;
  readonly triggeredRules: readonly GuardianRuleEvaluation[];
  readonly clearedRules: readonly GuardianRuleEvaluation[];
  readonly activeRestrictions: readonly GuardianRestriction[];
  readonly newInterventions: readonly GuardianIntervention[];
  readonly recoveryPlans: readonly GuardianRecoveryPlan[];
  readonly explanation: string;
  readonly highestSeverity: GuardianSeverity;
  readonly blockedActions: readonly GuardianBlockedAction[];
  readonly CommanderSignal: 'none' | 'caution' | 'restriction' | 'lockout' | 'recovery';
  readonly noOpReason?: string;
}

export function evaluateGuardianProtection(
  input: GuardianProtectionEngineInput,
): GuardianProtectionDecision {
  const existingActiveRestrictions = (input.existingRestrictions ?? []).filter((restriction) => restriction.status === 'active');
  const evidence = collectEngineEvidence(input);
  const triggeredRules = [
    ...input.capitalProtection?.evaluations.filter((evaluation) => evaluation.result === 'triggered' || evaluation.result === 'missing_evidence') ?? [],
    ...buildLifecycleEvaluations(input, evidence),
  ];
  const clearedRules = [
    ...input.capitalProtection?.evaluations.filter((evaluation) => evaluation.result === 'clear') ?? [],
  ];
  const activeRestrictions = dedupeRestrictions([
    ...existingActiveRestrictions,
    ...input.capitalProtection?.restrictions ?? [],
    ...restrictionsFromTriggeredRules(input, triggeredRules, evidence),
    ...restrictionsFromConsequences(input, evidence),
    ...restrictionsFromJudgmentReserve(input, evidence),
    ...restrictionsFromSuccessProtocol(input, evidence),
  ]);
  const recoveryPlans = [
    ...input.capitalProtection?.recoveryPlans ?? [],
    ...activeRestrictions.flatMap((restriction) => restriction.recoveryPlanId ? [] : []),
  ];
  const blockedActions = getGuardianBlockedActions(activeRestrictions);
  const highestSeverity = getGuardianHighestSeverity([
    ...activeRestrictions.map(restrictionSeverity),
    ...triggeredRules.map((evaluation) => severityFromState(evaluation.state)),
  ]);
  const verdict = resolveVerdict({
    activeRestrictions,
    blockingConsequences: (input.operationalConsequences ?? []).filter(isOperationalConsequenceBlocking),
    ...(input.capitalProtection ? { capitalVerdict: input.capitalProtection.verdict } : {}),
    ...(input.judgmentReserve ? { judgmentReserve: input.judgmentReserve } : {}),
    ...(input.successProtocol ? { successProtocol: input.successProtocol } : {}),
  });
  const state = stateFromVerdict(verdict, activeRestrictions);
  const newInterventions = buildInterventions(input, verdict, activeRestrictions, evidence);

  return Object.freeze({
    state,
    verdict,
    triggeredRules: Object.freeze(triggeredRules),
    clearedRules: Object.freeze(clearedRules),
    activeRestrictions: Object.freeze(activeRestrictions),
    newInterventions: Object.freeze(newInterventions),
    recoveryPlans: Object.freeze(recoveryPlans),
    explanation: buildProtectionExplanation(input, verdict, activeRestrictions),
    highestSeverity,
    blockedActions,
    CommanderSignal: commanderSignalForVerdict(verdict),
    ...(verdict === 'no_action' ? { noOpReason: 'Guardian found no active protection issue.' } : {}),
  });
}

function buildLifecycleEvaluations(
  input: GuardianProtectionEngineInput,
  evidence: readonly GuardianEvidence[],
): readonly GuardianRuleEvaluation[] {
  const evaluations: GuardianRuleEvaluation[] = [];
  const stage = input.lifecycle.activeStage;
  const context = input.missionContext;
  const missing: string[] = [];

  if (!hasText(context?.missionObjective)) missing.push('mission objective');
  if (!hasText(context?.riskLimit)) missing.push('risk limit');
  if (!hasText(context?.operatorCondition)) missing.push('operator condition');

  if (missing.length > 0 && (stage === 'briefing' || stage === 'authorization')) {
    evaluations.push({
      evaluationId: `guardian-evaluation:${input.missionId}:briefing-context:${missing.join('-')}`,
      ruleId: 'guardian-briefing-context-required',
      missionId: input.missionId,
      result: 'missing_evidence',
      state: 'caution',
      explanation: `Briefing context missing: ${missing.join(', ')}.`,
      evidenceReferences: evidence,
      missingEvidence: missing,
      triggeredAt: input.evaluatedAt,
      sourceRevision: '1',
    });
  }

  if (stage === 'observation' && context?.observationComplete === false) {
    evaluations.push({
      evaluationId: `guardian-evaluation:${input.missionId}:observation-incomplete`,
      ruleId: 'guardian-observation-complete',
      missionId: input.missionId,
      result: 'missing_evidence',
      state: 'caution',
      explanation: 'Observation evidence is incomplete.',
      evidenceReferences: evidence,
      missingEvidence: ['observation evidence'],
      triggeredAt: input.evaluatedAt,
      sourceRevision: '1',
    });
  }

  if (stage === 'authorization' && !hasText(context?.protectiveRule)) {
    evaluations.push({
      evaluationId: `guardian-evaluation:${input.missionId}:protective-rule-missing`,
      ruleId: 'guardian-protective-rule-required',
      missionId: input.missionId,
      result: 'triggered',
      state: 'restriction',
      explanation: 'Authorization requires a protective rule.',
      evidenceReferences: evidence,
      missingEvidence: ['protective rule'],
      triggeredAt: input.evaluatedAt,
      sourceRevision: '1',
    });
  }

  return evaluations;
}

function restrictionsFromConsequences(
  input: GuardianProtectionEngineInput,
  evidence: readonly GuardianEvidence[],
): readonly GuardianRestriction[] {
  return (input.operationalConsequences ?? [])
    .filter(isOperationalConsequenceBlocking)
    .map((consequence) => ({
      restrictionId: `guardian-restriction:${consequence.consequenceId}`,
      ruleId: `consequence:${consequence.type}`,
      missionId: consequence.missionId,
      blockedActions: consequence.type === 'persistence_failure'
        ? ['archive_mission', 'finalize_persistence'] as const
        : ['request_authorization', 'approve_authorization'] as const,
      explanation: consequence.explanation,
      evidenceReferences: evidenceFromConsequence(consequence, evidence),
      startedAt: consequence.activatedAt ?? consequence.createdAt,
      status: 'active' as const,
    }));
}

function restrictionsFromTriggeredRules(
  input: GuardianProtectionEngineInput,
  evaluations: readonly GuardianRuleEvaluation[],
  evidence: readonly GuardianEvidence[],
): readonly GuardianRestriction[] {
  return evaluations
    .filter((evaluation) => evaluation.result === 'triggered' && evaluation.state === 'restriction')
    .map((evaluation) => ({
      restrictionId: `guardian-restriction:${input.missionId}:${evaluation.ruleId}`,
      ruleId: evaluation.ruleId,
      missionId: input.missionId,
      blockedActions: ['request_authorization', 'approve_authorization'] as const,
      explanation: evaluation.explanation,
      evidenceReferences: evaluation.evidenceReferences.length > 0 ? evaluation.evidenceReferences : evidence,
      startedAt: evaluation.triggeredAt ?? input.evaluatedAt,
      status: 'active' as const,
    }));
}

function restrictionsFromJudgmentReserve(
  input: GuardianProtectionEngineInput,
  evidence: readonly GuardianEvidence[],
): readonly GuardianRestriction[] {
  const reserve = input.judgmentReserve;
  if (reserve === undefined || reserve.blockingEffect === 'none' || reserve.blockingEffect === 'caution_operator') return [];
  return [{
    restrictionId: `guardian-restriction:${input.missionId}:judgment-reserve`,
    ruleId: 'guardian-judgment-reserve',
    missionId: input.missionId,
    blockedActions: reserve.blockingEffect === 'suspend_deployment'
      ? ['request_authorization', 'approve_authorization', 'deploy_mission']
      : ['request_authorization', 'approve_authorization'],
    explanation: reserve.explanation,
    evidenceReferences: reserve.supportingEvidence.length > 0 ? reserve.supportingEvidence : evidence,
    startedAt: reserve.lastUpdated,
    status: 'active',
  }];
}

function restrictionsFromSuccessProtocol(
  input: GuardianProtectionEngineInput,
  evidence: readonly GuardianEvidence[],
): readonly GuardianRestriction[] {
  const protocol = input.successProtocol;
  if (protocol === undefined || protocol.verdict !== 'require_clarification') return [];
  return [{
    restrictionId: `guardian-restriction:${input.missionId}:success-protocol-review`,
    ruleId: 'guardian-success-protocol',
    missionId: input.missionId,
    blockedActions: ['approve_authorization'],
    explanation: protocol.explanation,
    evidenceReferences: protocol.evidenceReferences.length > 0 ? protocol.evidenceReferences : evidence,
    startedAt: input.evaluatedAt,
    status: 'active',
  }];
}

function buildInterventions(
  input: GuardianProtectionEngineInput,
  verdict: GuardianVerdict,
  restrictions: readonly GuardianRestriction[],
  evidence: readonly GuardianEvidence[],
): readonly GuardianIntervention[] {
  if (verdict === 'no_action' || verdict === 'monitor') return [];
  return [Object.freeze({
    interventionId: `guardian-intervention:${input.missionId}:${verdict}:${restrictions.map((restriction) => restriction.restrictionId).join('-') || 'caution'}`,
    missionId: input.missionId,
    verdict,
    severity: verdict === 'enforce_lockout' || verdict === 'suspend_deployment' ? 'lockout' : restrictions.length > 0 ? 'restriction' : 'caution',
    title: titleForVerdict(verdict),
    explanation: buildProtectionExplanation(input, verdict, restrictions),
    evidenceReferences: Object.freeze(evidence),
    restrictionIds: Object.freeze(restrictions.map((restriction) => restriction.restrictionId)),
    createdAt: input.evaluatedAt,
  })];
}

function resolveVerdict(input: {
  readonly activeRestrictions: readonly GuardianRestriction[];
  readonly capitalVerdict?: GuardianVerdict;
  readonly judgmentReserve?: GuardianJudgmentReserve;
  readonly successProtocol?: GuardianSuccessProtocolDecision;
  readonly blockingConsequences: readonly OperationalConsequence[];
}): GuardianVerdict {
  if (input.capitalVerdict === 'enforce_lockout') return 'enforce_lockout';
  if (input.judgmentReserve?.blockingEffect === 'suspend_deployment') return 'suspend_deployment';
  if (input.activeRestrictions.some((restriction) => restriction.blockedActions.includes('deploy_mission'))) return 'suspend_deployment';
  if (input.activeRestrictions.some((restriction) => restriction.blockedActions.includes('request_authorization') || restriction.blockedActions.includes('approve_authorization'))) return 'deny_authorization';
  if (input.capitalVerdict === 'require_clarification') return 'require_clarification';
  if (input.successProtocol?.verdict === 'caution_operator') return 'caution_operator';
  if (input.blockingConsequences.length > 0) return 'begin_recovery';
  return 'no_action';
}

function stateFromVerdict(verdict: GuardianVerdict, restrictions: readonly GuardianRestriction[]): GuardianProtectionState {
  if (verdict === 'enforce_lockout' || verdict === 'suspend_deployment') return 'lockout';
  if (restrictions.length > 0 || verdict === 'deny_authorization') return 'restriction';
  if (verdict === 'begin_recovery') return 'recovery';
  if (verdict === 'caution_operator' || verdict === 'require_clarification') return 'caution';
  return 'secure';
}

function commanderSignalForVerdict(verdict: GuardianVerdict): GuardianProtectionDecision['CommanderSignal'] {
  if (verdict === 'enforce_lockout' || verdict === 'suspend_deployment') return 'lockout';
  if (verdict === 'deny_authorization' || verdict === 'restrict_authorization') return 'restriction';
  if (verdict === 'begin_recovery') return 'recovery';
  if (verdict === 'caution_operator' || verdict === 'require_clarification') return 'caution';
  return 'none';
}

function buildProtectionExplanation(
  input: GuardianProtectionEngineInput,
  verdict: GuardianVerdict,
  restrictions: readonly GuardianRestriction[],
): string {
  if (restrictions[0]) return restrictions[0].explanation;
  if (input.successProtocol?.verdict === 'caution_operator') return input.successProtocol.explanation;
  if (input.capitalProtection?.explanation) return input.capitalProtection.explanation;
  if (input.judgmentReserve?.explanation) return input.judgmentReserve.explanation;
  return verdict === 'no_action' ? 'Guardian protection is secure.' : `Guardian verdict: ${verdict}.`;
}

function titleForVerdict(verdict: GuardianVerdict): string {
  if (verdict === 'enforce_lockout') return 'Guardian lockout active';
  if (verdict === 'suspend_deployment') return 'Deployment suspended';
  if (verdict === 'deny_authorization') return 'Authorization denied';
  if (verdict === 'require_clarification') return 'Clarification required';
  if (verdict === 'begin_recovery') return 'Recovery required';
  return 'Guardian caution';
}

function collectEngineEvidence(input: GuardianProtectionEngineInput): readonly GuardianEvidence[] {
  return Object.freeze([
    {
      evidenceId: `guardian-engine:${input.missionId}:${input.evaluatedAt}`,
      source: 'guardian-protection-engine',
      description: `Guardian evaluated ${input.lifecycle.activeStage}.`,
      missionId: input.missionId,
      createdAt: input.evaluatedAt,
    },
    ...input.capitalProtection?.evidence ?? [],
    ...input.judgmentReserve?.supportingEvidence ?? [],
    ...input.successProtocol?.evidenceReferences ?? [],
  ]);
}

function evidenceFromConsequence(
  consequence: OperationalConsequence,
  fallback: readonly GuardianEvidence[],
): readonly GuardianEvidence[] {
  if (consequence.evidenceReferences.length === 0) return fallback;
  return consequence.evidenceReferences.map((reference) => Object.freeze({
    evidenceId: reference.id,
    source: reference.source,
    description: reference.description ?? consequence.explanation,
    missionId: consequence.missionId,
    createdAt: consequence.createdAt,
  }));
}

function dedupeRestrictions(restrictions: readonly GuardianRestriction[]): readonly GuardianRestriction[] {
  const byId = new Map<string, GuardianRestriction>();
  for (const restriction of restrictions) {
    if (!byId.has(restriction.restrictionId)) byId.set(restriction.restrictionId, restriction);
  }
  return Object.freeze([...byId.values()]);
}

function restrictionSeverity(restriction: GuardianRestriction): GuardianSeverity {
  if (restriction.blockedActions.includes('continue_session')) return 'lockout';
  if (restriction.blockedActions.includes('deploy_mission')) return 'restriction';
  return 'warning';
}

function severityFromState(state: GuardianProtectionState): GuardianSeverity {
  if (state === 'lockout') return 'lockout';
  if (state === 'restriction' || state === 'recovery') return 'restriction';
  if (state === 'warning') return 'warning';
  if (state === 'caution') return 'caution';
  return 'notice';
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
