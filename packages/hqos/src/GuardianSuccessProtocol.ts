import type { GuardianEvidence, GuardianVerdict } from './GuardianProtection';

export type GuardianSuccessProtocolDetection =
  | 'success_streak_stable'
  | 'success_streak_with_process_discipline'
  | 'confidence_escalation'
  | 'risk_escalation_after_success'
  | 'observation_quality_decline_after_success'
  | 'debrief_quality_decline_after_success'
  | 'euphoria_risk_pattern'
  | 'no_action_required';

export interface GuardianSuccessMissionEvidence {
  readonly missionId: string;
  readonly completedAt: string;
  readonly profitableOutcome?: boolean;
  readonly strongEvaluation?: boolean;
  readonly requestedRisk?: number;
  readonly observationComplete?: boolean;
  readonly debriefComplete?: boolean;
  readonly operatorReportedConfidence?: string;
}

export interface GuardianSuccessProtocolInput {
  readonly missionId: string;
  readonly evaluatedAt: string;
  readonly recentMissions: readonly GuardianSuccessMissionEvidence[];
}

export interface GuardianSuccessProtocolDecision {
  readonly detection: GuardianSuccessProtocolDetection;
  readonly verdict: GuardianVerdict;
  readonly explanation: string;
  readonly changed: readonly string[];
  readonly supportingMissionIds: readonly string[];
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly requiredAction: string;
}

export function evaluateGuardianSuccessProtocol(
  input: GuardianSuccessProtocolInput,
): GuardianSuccessProtocolDecision {
  const recent = [...input.recentMissions].sort((left, right) => left.completedAt.localeCompare(right.completedAt)).slice(-5);
  const successful = recent.filter((mission) => mission.profitableOutcome === true || mission.strongEvaluation === true);
  const missionIds = successful.map((mission) => mission.missionId);
  const evidence = missionIds.map((missionId) => Object.freeze({
    evidenceId: `success-protocol:${missionId}`,
    source: 'mission-evaluation',
    description: `Mission ${missionId} contributed to success protocol review.`,
    missionId,
    createdAt: input.evaluatedAt,
  }));

  if (successful.length < 2) {
    return decision('no_action_required', 'no_action', 'Success Protocol has insufficient streak evidence for intervention.', [], missionIds, evidence);
  }

  const riskEscalated = hasRiskEscalation(successful);
  const observationDeclined = successful.some((mission) => mission.observationComplete === false);
  const debriefDeclined = successful.some((mission) => mission.debriefComplete === false);
  const confidenceEscalated = successful.some((mission) => /overconfident|euphoric|invincible|easy/iu.test(mission.operatorReportedConfidence ?? ''));

  if (riskEscalated) {
    return decision(
      confidenceEscalated ? 'euphoria_risk_pattern' : 'risk_escalation_after_success',
      'caution_operator',
      'Requested risk increased after recent successful missions. Authorization requires explicit review.',
      ['requested risk increased after success'],
      missionIds,
      evidence,
    );
  }

  if (observationDeclined) {
    return decision(
      'observation_quality_decline_after_success',
      'require_clarification',
      'Observation completeness declined after successful missions. War Room requires a visible-evidence challenge.',
      ['observation completeness declined'],
      missionIds,
      evidence,
    );
  }

  if (debriefDeclined) {
    return decision(
      'debrief_quality_decline_after_success',
      'monitor',
      'Debrief quality declined after success. Guardian recommends reflection before treating the streak as stable.',
      ['debrief completeness declined'],
      missionIds,
      evidence,
    );
  }

  if (successful.every((mission) => mission.observationComplete !== false && mission.debriefComplete !== false)) {
    return decision(
      'success_streak_with_process_discipline',
      'no_action',
      'Recent profitable missions remain process-compliant. Guardian requires no intervention.',
      ['success with process discipline'],
      missionIds,
      evidence,
    );
  }

  return decision('success_streak_stable', 'monitor', 'Success streak is stable and remains under Guardian observation.', [], missionIds, evidence);
}

function hasRiskEscalation(missions: readonly GuardianSuccessMissionEvidence[]): boolean {
  const risks = missions
    .map((mission) => mission.requestedRisk)
    .filter((risk): risk is number => risk !== undefined);
  if (risks.length < 2) return false;
  const first = risks[0];
  const last = risks[risks.length - 1];
  return first !== undefined && last !== undefined && last > first;
}

function decision(
  detection: GuardianSuccessProtocolDetection,
  verdict: GuardianVerdict,
  explanation: string,
  changed: readonly string[],
  missionIds: readonly string[],
  evidence: readonly GuardianEvidence[],
): GuardianSuccessProtocolDecision {
  return Object.freeze({
    detection,
    verdict,
    explanation,
    changed: Object.freeze([...changed]),
    supportingMissionIds: Object.freeze([...missionIds]),
    evidenceReferences: Object.freeze(evidence),
    requiredAction: verdict === 'no_action'
      ? 'No Guardian action required.'
      : verdict === 'require_clarification'
        ? 'Complete explicit War Room challenge.'
        : 'Review success protocol before authorization.',
  });
}
