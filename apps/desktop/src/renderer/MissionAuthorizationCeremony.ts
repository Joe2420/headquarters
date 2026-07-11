export type MissionAuthorizationCeremonyState =
  | 'authorization_pending'
  | 'authorization_evaluating'
  | 'authorization_denied'
  | 'authorization_approved'
  | 'authorization_ceremony'
  | 'deployed';

export interface MissionAuthorizationCeremonyContext {
  readonly missionId: string;
  readonly decision: 'approved' | 'denied' | 'pending';
  readonly ceremonyPlayed: boolean;
  readonly reducedMotion?: boolean | undefined;
  readonly videoAvailable?: boolean | undefined;
}

export interface MissionAuthorizationCeremonyResult {
  readonly state: MissionAuthorizationCeremonyState;
  readonly shouldPlayCeremony: boolean;
  readonly commanderLines: readonly string[];
  readonly mayDeploy: boolean;
}

export function resolveMissionAuthorizationCeremony(
  context: MissionAuthorizationCeremonyContext,
): MissionAuthorizationCeremonyResult {
  if (context.decision === 'pending') {
    return {
      state: 'authorization_pending',
      shouldPlayCeremony: false,
      commanderLines: ['Authorization package pending.'],
      mayDeploy: false,
    };
  }

  if (context.decision === 'denied') {
    return {
      state: 'authorization_denied',
      shouldPlayCeremony: false,
      commanderLines: ['Authorization withheld.', 'Return to Observation.'],
      mayDeploy: false,
    };
  }

  if (context.ceremonyPlayed) {
    return {
      state: 'deployed',
      shouldPlayCeremony: false,
      commanderLines: ['Mission deployment active.'],
      mayDeploy: true,
    };
  }

  return {
    state: context.reducedMotion || context.videoAvailable === false
      ? 'authorization_approved'
      : 'authorization_ceremony',
    shouldPlayCeremony: true,
    commanderLines: ['Authorization accepted.', 'Mission deployment active.'],
    mayDeploy: true,
  };
}

export function markAuthorizationCeremonyComplete(
  context: MissionAuthorizationCeremonyContext,
): MissionAuthorizationCeremonyContext {
  return {
    ...context,
    ceremonyPlayed: context.decision === 'approved' ? true : context.ceremonyPlayed,
  };
}
