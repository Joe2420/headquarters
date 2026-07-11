export type MissionPersistenceState = 'saved' | 'saving' | 'save_failed' | 'recovery_available';

export interface MissionPersistenceStatus {
  readonly missionId?: string | undefined;
  readonly state: MissionPersistenceState;
  readonly lastSavedAt?: string | undefined;
  readonly pendingReason?: string | undefined;
  readonly failureReason?: string | undefined;
}

export function createMissionPersistenceStatus(input: {
  readonly missionId?: string | undefined;
  readonly state?: MissionPersistenceState | undefined;
  readonly now?: string | undefined;
  readonly reason?: string | undefined;
} = {}): MissionPersistenceStatus {
  const state = input.state ?? 'saved';
  return {
    ...(input.missionId ? { missionId: input.missionId } : {}),
    state,
    ...(state === 'saved' ? { lastSavedAt: input.now ?? new Date().toISOString() } : {}),
    ...(state === 'saving' ? { pendingReason: input.reason ?? 'Mission update pending persistence.' } : {}),
    ...(state === 'save_failed' ? { failureReason: input.reason ?? 'Mission save failed.' } : {}),
  };
}

export function markMissionSavePending(
  current: MissionPersistenceStatus,
  missionId: string,
  reason: string,
): MissionPersistenceStatus {
  return {
    ...current,
    missionId,
    state: 'saving',
    pendingReason: reason,
  };
}

export function markMissionSaveSucceeded(
  missionId: string,
  savedAt: string = new Date().toISOString(),
): MissionPersistenceStatus {
  return {
    missionId,
    state: 'saved',
    lastSavedAt: savedAt,
  };
}

export function markMissionSaveFailed(
  current: MissionPersistenceStatus,
  reason: string,
): MissionPersistenceStatus {
  return {
    ...current,
    state: 'save_failed',
    failureReason: reason,
  };
}

export function recoverIncompleteMissionStatus(
  missions: readonly { readonly id: string; readonly currentState: string; readonly createdAt: string }[],
): MissionPersistenceStatus | undefined {
  const recovered = [...missions]
    .filter((mission) => mission.currentState !== 'archived')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .at(0);

  if (!recovered) return undefined;

  return {
    missionId: recovered.id,
    state: 'recovery_available',
    pendingReason: 'An unfinished mission record was recovered.',
  };
}

export function formatMissionPersistenceStatus(status: MissionPersistenceStatus): string {
  if (status.state === 'saved') return status.lastSavedAt ? `Saved ${status.lastSavedAt}` : 'Saved';
  if (status.state === 'saving') return status.pendingReason ?? 'Saving';
  if (status.state === 'save_failed') return status.failureReason ?? 'Save failed';
  return status.pendingReason ?? 'Recovery available';
}
