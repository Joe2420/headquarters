import type { GuardianAlert, GuardianLockoutState } from '@headquarters/guardian';

export interface WarRoomGuardianProtectionInput {
  readonly alerts: readonly GuardianAlert[];
  readonly lockout: GuardianLockoutState;
  readonly authorizationApproved?: boolean;
  readonly recoveryCleared?: boolean;
}

export interface WarRoomGuardianProtectionModel {
  readonly state: 'secure' | 'caution' | 'restriction' | 'lockout';
  readonly authorizationEligibility: 'available' | 'extra_confirmation_required' | 'blocked';
  readonly deploymentEligibility: 'available' | 'blocked';
  readonly verdict: string;
  readonly guardianItems: readonly { readonly label: string; readonly status: 'clear' | 'warning' | 'blocked' }[];
  readonly deployedActions: readonly string[];
  readonly returnContext: string;
}

export function buildWarRoomGuardianProtection(
  input: WarRoomGuardianProtectionInput,
): WarRoomGuardianProtectionModel {
  const critical = input.lockout.status === 'locked' || input.alerts.some((alert) => alert.priority === 'critical');
  const high = input.alerts.some((alert) => alert.priority === 'high');
  const medium = input.alerts.some((alert) => alert.priority === 'medium');
  const state = critical ? 'lockout' : high ? 'restriction' : medium ? 'caution' : 'secure';
  const authorizationEligibility = critical || high
    ? 'blocked'
    : medium
      ? 'extra_confirmation_required'
      : 'available';
  const deploymentEligibility = critical || high || input.authorizationApproved !== true ? 'blocked' : 'available';
  const guardianItems: WarRoomGuardianProtectionModel['guardianItems'] = Object.freeze([
    {
      label: input.lockout.status === 'locked' ? input.lockout.explanation : 'Guardian lockout clear',
      status: input.lockout.status === 'locked' ? 'blocked' : 'clear',
    },
    {
      label: high ? 'Guardian restriction requires recovery before authorization' : medium ? 'Guardian caution requires extra confirmation' : 'Guardian monitoring active',
      status: high ? 'blocked' : medium ? 'warning' : 'clear',
    },
    {
      label: input.recoveryCleared === true ? 'Recovery cleared; eligibility can update immediately' : 'Recovery evidence pending only when an intervention is active',
      status: input.recoveryCleared === true ? 'clear' : critical || high ? 'warning' : 'clear',
    },
  ]);

  return Object.freeze({
    state,
    authorizationEligibility,
    deploymentEligibility,
    verdict: formatVerdict(state, input.lockout),
    guardianItems,
    deployedActions: Object.freeze(resolveDeployedActions(state)),
    returnContext: state === 'secure'
      ? 'Return to War Room operation after any Guardian review.'
      : 'Route to Guardian Wing and preserve deployed mission context before returning.',
  });
}

function formatVerdict(state: WarRoomGuardianProtectionModel['state'], lockout: GuardianLockoutState): string {
  if (state === 'lockout') return `Deployment blocked. ${lockout.explanation}`;
  if (state === 'restriction') return 'Authorization blocked by Guardian restriction.';
  if (state === 'caution') return 'Authorization available with explicit Guardian confirmation.';
  return 'No Guardian restriction. Proceed from evidence only.';
}

function resolveDeployedActions(state: WarRoomGuardianProtectionModel['state']): readonly string[] {
  if (state === 'lockout') return ['Review Guardian Warning', 'Return to Base', 'End Session'];
  if (state === 'restriction') return ['Review Guardian Warning', 'Report Material Change', 'Return to Base'];
  return ['Report Material Change', 'Confirm Plan Validity', 'Return to Base'];
}
