import {
  getOutstandingRecoveryRequirements,
  isOperationalConsequenceBlocking,
  type OperationalConsequence,
  type RecoveryRequirement,
} from './OperationalConsequence';

export type MissionConsequenceAction =
  | 'enter_war_room'
  | 'request_authorization'
  | 'deploy_mission'
  | 'complete_debrief'
  | 'archive_mission';

export interface ConsequenceActionDecision {
  readonly allowed: boolean;
  readonly action: MissionConsequenceAction;
  readonly blockingConsequences: readonly OperationalConsequence[];
  readonly reason: string;
  readonly recoveryActions: readonly RecoveryRequirement[];
}

export function getBlockingConsequencesForMission(
  consequences: readonly OperationalConsequence[],
  missionId: string,
): readonly OperationalConsequence[] {
  return consequences
    .filter((consequence) => consequence.missionId === missionId)
    .filter(isOperationalConsequenceBlocking);
}

export function canEnterWarRoom(consequences: readonly OperationalConsequence[], missionId: string): ConsequenceActionDecision {
  return decide('enter_war_room', consequences, missionId, ['unresolved_contradiction', 'missing_required_evidence']);
}

export function canRequestAuthorization(consequences: readonly OperationalConsequence[], missionId: string): ConsequenceActionDecision {
  return decide('request_authorization', consequences, missionId, [
    'authorization_without_protective_rule',
    'unresolved_contradiction',
    'guardian_lockout',
    'risk_limit_violation',
  ]);
}

export function canDeployMission(consequences: readonly OperationalConsequence[], missionId: string): ConsequenceActionDecision {
  return decide('deploy_mission', consequences, missionId, ['guardian_lockout', 'risk_limit_violation', 'persistence_failure']);
}

export function canCompleteDebrief(consequences: readonly OperationalConsequence[], missionId: string): ConsequenceActionDecision {
  return decide('complete_debrief', consequences, missionId, ['persistence_failure']);
}

export function canArchiveMission(consequences: readonly OperationalConsequence[], missionId: string): ConsequenceActionDecision {
  return decide('archive_mission', consequences, missionId, ['incomplete_debrief', 'persistence_failure', 'lifecycle_inconsistency']);
}

export function getRequiredRecoveryActions(
  consequences: readonly OperationalConsequence[],
  missionId: string,
): readonly RecoveryRequirement[] {
  return getBlockingConsequencesForMission(consequences, missionId)
    .flatMap(getOutstandingRecoveryRequirements);
}

export function getConsequenceBlockedActionReason(decision: ConsequenceActionDecision): string {
  return decision.reason;
}

function decide(
  action: MissionConsequenceAction,
  consequences: readonly OperationalConsequence[],
  missionId: string,
  blockingTypes: readonly OperationalConsequence['type'][],
): ConsequenceActionDecision {
  const blockingConsequences = getBlockingConsequencesForMission(consequences, missionId)
    .filter((consequence) => blockingTypes.includes(consequence.type));
  const recoveryActions = blockingConsequences.flatMap(getOutstandingRecoveryRequirements);
  const allowed = blockingConsequences.length === 0;

  return {
    allowed,
    action,
    blockingConsequences,
    reason: allowed
      ? 'No active operational consequence blocks this action.'
      : `${blockingConsequences[0]?.title ?? 'Operational consequence active'}: ${blockingConsequences[0]?.effect ?? 'Action is blocked.'}`,
    recoveryActions,
  };
}
