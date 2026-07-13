import type { GuardianEvidence, GuardianJudgmentReserve } from './GuardianProtection';

export interface GuardianJudgmentReserveInput {
  readonly evaluatedAt: string;
  readonly missionCountInSession?: number;
  readonly unresolvedGuardianWarningCount?: number;
  readonly repeatedAuthorizationAttemptCount?: number;
  readonly lifecycleRecoveryCount?: number;
  readonly operatorReportedState?: string;
  readonly activeConsequenceSeverity?: 'informational' | 'caution' | 'restriction' | 'lockout';
  readonly recentMissionEvaluationQuality?: 'strong' | 'disciplined' | 'weak' | 'failed' | 'unknown';
  readonly unresolvedContradictionCount?: number;
  readonly sessionDurationMinutes?: number;
  readonly repeatedRiskLimitPressureCount?: number;
  readonly successfulRecoveryCount?: number;
  readonly completedDeliberatePauseCount?: number;
  readonly previousReserve?: GuardianJudgmentReserve;
}

export interface GuardianJudgmentReserveDecision {
  readonly reserve: GuardianJudgmentReserve;
  readonly evidence: readonly GuardianEvidence[];
  readonly internalPressureIndex: number;
}

export function evaluateGuardianJudgmentReserve(input: GuardianJudgmentReserveInput): GuardianJudgmentReserveDecision {
  const degradingFactors = buildDegradingFactors(input);
  const improvingFactors = buildImprovingFactors(input);
  const evidence = buildJudgmentEvidence(input, degradingFactors, improvingFactors);
  const pressure = Math.max(0, degradingFactors.length * 2 - improvingFactors.length);
  const state = resolveReserveState(input, pressure);
  const trend = resolveReserveTrend(input.previousReserve?.state, state);

  return Object.freeze({
    reserve: Object.freeze({
      state,
      explanation: buildReserveExplanation(state, degradingFactors, improvingFactors),
      supportingEvidence: evidence,
      degradingFactors: Object.freeze(degradingFactors),
      improvingFactors: Object.freeze(improvingFactors),
      lastUpdated: input.evaluatedAt,
      recommendedAction: recommendationForState(state),
      blockingEffect: blockingForState(state),
      trend,
    }),
    evidence,
    internalPressureIndex: pressure,
  });
}

export function reloadGuardianJudgmentReserve(reserve: GuardianJudgmentReserve): GuardianJudgmentReserve {
  return Object.freeze({
    ...reserve,
    supportingEvidence: Object.freeze(reserve.supportingEvidence.map((item) => Object.freeze({ ...item }))),
    degradingFactors: Object.freeze([...reserve.degradingFactors]),
    improvingFactors: Object.freeze([...reserve.improvingFactors]),
  });
}

function buildDegradingFactors(input: GuardianJudgmentReserveInput): string[] {
  const factors: string[] = [];
  if ((input.unresolvedGuardianWarningCount ?? 0) >= 2) factors.push('Repeated unresolved Guardian warnings.');
  if ((input.repeatedAuthorizationAttemptCount ?? 0) >= 2) factors.push('Repeated authorization attempts without resolution.');
  if ((input.lifecycleRecoveryCount ?? 0) >= 2) factors.push('Repeated lifecycle recovery in current session.');
  if (isDeterioratedSelfReport(input.operatorReportedState)) factors.push(`Operator reported ${input.operatorReportedState}.`);
  if (input.activeConsequenceSeverity === 'restriction' || input.activeConsequenceSeverity === 'lockout') factors.push(`Active ${input.activeConsequenceSeverity} consequence.`);
  if (input.recentMissionEvaluationQuality === 'failed' || input.recentMissionEvaluationQuality === 'weak') factors.push(`Recent mission evaluation was ${input.recentMissionEvaluationQuality}.`);
  if ((input.unresolvedContradictionCount ?? 0) > 0) factors.push('Unresolved contradiction remains.');
  if ((input.sessionDurationMinutes ?? 0) >= 180) factors.push('Long session duration.');
  if ((input.repeatedRiskLimitPressureCount ?? 0) >= 2) factors.push('Repeated risk-limit pressure.');
  return factors;
}

function buildImprovingFactors(input: GuardianJudgmentReserveInput): string[] {
  const factors: string[] = [];
  if ((input.successfulRecoveryCount ?? 0) > 0) factors.push('Successful recovery evidence recorded.');
  if ((input.completedDeliberatePauseCount ?? 0) > 0) factors.push('Deliberate pause completed.');
  if (input.recentMissionEvaluationQuality === 'strong' || input.recentMissionEvaluationQuality === 'disciplined') {
    factors.push(`Recent mission evaluation was ${input.recentMissionEvaluationQuality}.`);
  }
  return factors;
}

function resolveReserveState(
  input: GuardianJudgmentReserveInput,
  pressure: number,
): GuardianJudgmentReserve['state'] {
  if (input.activeConsequenceSeverity === 'lockout' || pressure >= 8) return 'depleted';
  if (pressure >= 6) return 'strained';
  if (pressure >= 3) return 'reduced';
  if ((input.successfulRecoveryCount ?? 0) > 0 && (input.unresolvedGuardianWarningCount ?? 0) > 0) return 'recovering';
  if (input.missionCountInSession === 0 && pressure === 0 && buildImprovingFactors(input).length === 0) return 'full';
  return 'stable';
}

function resolveReserveTrend(
  previous: GuardianJudgmentReserve['state'] | undefined,
  current: GuardianJudgmentReserve['state'],
): GuardianJudgmentReserve['trend'] {
  if (current === 'recovering') return 'recovering';
  if (previous === undefined) return 'stable';
  const previousRank = stateRank(previous);
  const currentRank = stateRank(current);
  if (currentRank < previousRank) return 'improving';
  if (currentRank > previousRank) return 'declining';
  return 'stable';
}

function buildReserveExplanation(
  state: GuardianJudgmentReserve['state'],
  degradingFactors: readonly string[],
  improvingFactors: readonly string[],
): string {
  if (degradingFactors.length === 0) return `Judgment Reserve is ${state}. No operational degradation evidence is active.`;
  return `Judgment Reserve is ${state}. ${degradingFactors[0]}${improvingFactors[0] ? ` ${improvingFactors[0]}` : ''}`;
}

function recommendationForState(state: GuardianJudgmentReserve['state']): string {
  if (state === 'depleted') return 'Suspend authorization and begin recovery.';
  if (state === 'strained') return 'Require stricter authorization review.';
  if (state === 'reduced') return 'Request deliberate confirmation before authorization.';
  if (state === 'recovering') return 'Continue recovery and confirm evidence.';
  return 'Continue normal Guardian monitoring.';
}

function blockingForState(state: GuardianJudgmentReserve['state']): GuardianJudgmentReserve['blockingEffect'] {
  if (state === 'depleted') return 'suspend_deployment';
  if (state === 'strained') return 'deny_authorization';
  if (state === 'reduced') return 'caution_operator';
  return 'none';
}

function buildJudgmentEvidence(
  input: GuardianJudgmentReserveInput,
  degradingFactors: readonly string[],
  improvingFactors: readonly string[],
): readonly GuardianEvidence[] {
  const evidence = [...degradingFactors, ...improvingFactors].map((description, index) => Object.freeze({
    evidenceId: `judgment:${input.evaluatedAt}:${index}`,
    source: 'guardian-judgment-reserve',
    description,
    createdAt: input.evaluatedAt,
  }));

  if (evidence.length === 0) {
    return Object.freeze([Object.freeze({
      evidenceId: `judgment:${input.evaluatedAt}:baseline`,
      source: 'guardian-judgment-reserve',
      description: 'No operational degradation evidence is active.',
      createdAt: input.evaluatedAt,
    })]);
  }

  return Object.freeze(evidence);
}

function isDeterioratedSelfReport(value: string | undefined): boolean {
  return value !== undefined && /tired|stressed|distracted|fatigue|overwhelmed/iu.test(value);
}

function stateRank(state: GuardianJudgmentReserve['state']): number {
  if (state === 'full') return 0;
  if (state === 'stable') return 1;
  if (state === 'recovering') return 2;
  if (state === 'reduced') return 3;
  if (state === 'strained') return 4;
  return 5;
}
