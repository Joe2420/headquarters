export type DeployedMissionStatus =
  | 'deployed_stable'
  | 'deployed_changed'
  | 'invalidation_near'
  | 'return_recommended'
  | 'return_requested';

export type DeployedMissionOperationalState =
  | 'active'
  | 'quiet'
  | 'waiting'
  | 'blocked'
  | 'paused'
  | 'idle'
  | 'abandoned';

export interface DeployedMissionCheckInDraft {
  readonly visibleCondition: string;
  readonly structureChanged?: string | undefined;
  readonly volumeChanged?: string | undefined;
  readonly liquidityChanged?: string | undefined;
  readonly invalidationApproaching?: string | undefined;
  readonly emotionalStateChanged?: string | undefined;
  readonly planValidity?: string | undefined;
  readonly continueOrReturn?: string | undefined;
}

export interface DeployedMissionCheckIn {
  readonly id: string;
  readonly missionId: string;
  readonly status: DeployedMissionStatus;
  readonly visibleCondition: string;
  readonly materialChange: string;
  readonly planValidity: string;
  readonly createdAt: string;
}

export interface DeployedMissionPresence {
  readonly missionId: string;
  readonly codename: string;
  readonly objective: string;
  readonly deploymentStatus: DeployedMissionStatus;
  readonly authorizationReasoning: string;
  readonly activeInvalidation: string;
  readonly riskLimit: string;
  readonly currentVisibleCondition: string;
  readonly elapsedLabel: string;
  readonly operationalState: DeployedMissionOperationalState;
  readonly checkInGuidance: string;
}

export function createDeployedMissionPresence(input: {
  readonly missionId: string;
  readonly codename: string;
  readonly objective: string;
  readonly authorizationReasoning?: string | undefined;
  readonly activeInvalidation?: string | undefined;
  readonly riskLimit?: string | undefined;
  readonly currentVisibleCondition?: string | undefined;
  readonly createdAt: string;
  readonly deployedAt?: string | undefined;
  readonly now?: string | undefined;
  readonly checkIns?: readonly DeployedMissionCheckIn[] | undefined;
  readonly commanderQuestionPending?: boolean | undefined;
  readonly planConcludedAt?: string | undefined;
}): DeployedMissionPresence {
  const latestCheckIn = [...(input.checkIns ?? [])]
    .filter((checkIn) => checkIn.missionId === input.missionId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1);

  return {
    missionId: input.missionId,
    codename: input.codename,
    objective: input.objective,
    deploymentStatus: latestCheckIn?.status ?? 'deployed_stable',
    authorizationReasoning: normalizeDisplayValue(input.authorizationReasoning, 'Authorization reasoning unavailable'),
    activeInvalidation: normalizeDisplayValue(input.activeInvalidation, 'Invalidation not declared'),
    riskLimit: normalizeDisplayValue(input.riskLimit, 'Risk limit not declared'),
    currentVisibleCondition: latestCheckIn?.visibleCondition
      ?? normalizeDisplayValue(input.currentVisibleCondition, 'Awaiting visible condition report'),
    elapsedLabel: formatElapsedMissionTime(input.deployedAt ?? input.createdAt, input.now),
    operationalState: deriveDeployedOperationalState({
      latestCheckIn,
      commanderQuestionPending: input.commanderQuestionPending,
      planConcludedAt: input.planConcludedAt,
    }),
    checkInGuidance: formatDeployedCheckInGuidance({
      latestCheckIn,
      commanderQuestionPending: input.commanderQuestionPending,
      planConcludedAt: input.planConcludedAt,
    }),
  };
}

export function createDeployedMissionCheckIn(input: {
  readonly missionId: string;
  readonly draft: DeployedMissionCheckInDraft;
  readonly previous?: readonly DeployedMissionCheckIn[] | undefined;
  readonly id?: string | undefined;
  readonly createdAt?: string | undefined;
}): DeployedMissionCheckIn | undefined {
  const visibleCondition = input.draft.visibleCondition.trim();
  if (!visibleCondition) return undefined;

  const materialChange = [
    input.draft.structureChanged,
    input.draft.volumeChanged,
    input.draft.liquidityChanged,
    input.draft.invalidationApproaching,
    input.draft.emotionalStateChanged,
  ].map((value) => value?.trim()).filter((value): value is string => Boolean(value)).join(' | ');

  const planValidity = input.draft.planValidity?.trim() || 'Plan validity unchanged';
  const status = deriveDeployedMissionStatus(input.draft);
  const createdAt = input.createdAt ?? new Date().toISOString();

  const duplicate = (input.previous ?? []).some((checkIn) => (
    checkIn.missionId === input.missionId
    && checkIn.visibleCondition === visibleCondition
    && checkIn.materialChange === (materialChange || 'No material change reported')
    && checkIn.planValidity === planValidity
  ));

  if (duplicate) return undefined;

  return {
    id: input.id ?? crypto.randomUUID(),
    missionId: input.missionId,
    status,
    visibleCondition,
    materialChange: materialChange || 'No material change reported',
    planValidity,
    createdAt,
  };
}

export function shouldThrottleDeployedCheckIn(input: {
  readonly lastCheckInAt?: string | undefined;
  readonly now: string;
  readonly throttleMs?: number | undefined;
}): boolean {
  if (!input.lastCheckInAt) return false;

  const elapsedMs = Date.parse(input.now) - Date.parse(input.lastCheckInAt);
  return Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < (input.throttleMs ?? 120000);
}

export function canRecordDeployedCheckIn(input: {
  readonly lastCheckInAt?: string | undefined;
  readonly now: string;
  readonly commanderQuestionPending?: boolean | undefined;
  readonly throttleMs?: number | undefined;
}): { readonly allowed: true } | { readonly allowed: false; readonly reason: 'commander_question_pending' | 'throttled' } {
  if (input.commanderQuestionPending === true) {
    return { allowed: false, reason: 'commander_question_pending' };
  }

  if (shouldThrottleDeployedCheckIn(input)) {
    return { allowed: false, reason: 'throttled' };
  }

  return { allowed: true };
}

export function markDeployedPlanConcluded(input: {
  readonly missionId: string;
  readonly createdAt?: string | undefined;
  readonly previous?: readonly DeployedMissionCheckIn[] | undefined;
}): DeployedMissionCheckIn | undefined {
  return createDeployedMissionCheckIn({
    missionId: input.missionId,
    previous: input.previous,
    createdAt: input.createdAt,
    draft: {
      visibleCondition: 'Plan concluded by operator.',
      continueOrReturn: 'Return to base.',
      planValidity: 'Plan concluded.',
    },
  });
}

function deriveDeployedMissionStatus(draft: DeployedMissionCheckInDraft): DeployedMissionStatus {
  const normalized = [
    draft.invalidationApproaching,
    draft.continueOrReturn,
    draft.planValidity,
  ].join(' ').toLowerCase();

  if (normalized.includes('return')) return 'return_requested';
  if (normalized.includes('near') || normalized.includes('approach')) return 'invalidation_near';
  if (normalized.includes('invalid') || normalized.includes('no longer')) return 'return_recommended';

  const changed = [draft.structureChanged, draft.volumeChanged, draft.liquidityChanged, draft.emotionalStateChanged]
    .some((value) => value !== undefined && value.trim().length > 0 && !value.toLowerCase().includes('no'));

  return changed ? 'deployed_changed' : 'deployed_stable';
}

export function formatElapsedMissionTime(createdAt: string, now?: string): string {
  const started = Date.parse(createdAt);
  const current = Date.parse(now ?? new Date().toISOString());
  const elapsed = current - started;

  if (!Number.isFinite(elapsed) || elapsed < 0) return 'Elapsed time unavailable';

  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Less than one minute deployed';
  if (minutes === 1) return '1 minute deployed';
  return `${minutes} minutes deployed`;
}

function deriveDeployedOperationalState(input: {
  readonly latestCheckIn?: DeployedMissionCheckIn | undefined;
  readonly commanderQuestionPending?: boolean | undefined;
  readonly planConcludedAt?: string | undefined;
}): DeployedMissionOperationalState {
  if (input.planConcludedAt) return 'paused';
  if (input.commanderQuestionPending === true) return 'blocked';
  if (input.latestCheckIn === undefined) return 'quiet';
  if (input.latestCheckIn.status === 'deployed_stable') return 'quiet';
  if (input.latestCheckIn.status === 'return_requested' || input.latestCheckIn.status === 'return_recommended') return 'paused';
  if (input.latestCheckIn.status === 'invalidation_near') return 'waiting';
  return 'active';
}

function formatDeployedCheckInGuidance(input: {
  readonly latestCheckIn?: DeployedMissionCheckIn | undefined;
  readonly commanderQuestionPending?: boolean | undefined;
  readonly planConcludedAt?: string | undefined;
}): string {
  if (input.planConcludedAt) return 'Plan has been concluded. Return to Base is the next valid action.';
  if (input.commanderQuestionPending === true) return 'Answer Commander before reporting another deployed check-in.';
  if (input.latestCheckIn === undefined) return 'No check-in required. Observation silence remains valid work unless conditions change.';
  if (input.latestCheckIn.status === 'deployed_stable') return 'Quiet period accepted. Report only material change.';
  if (input.latestCheckIn.status === 'invalidation_near') return 'Invalidation proximity is recorded. Stay inside the declared plan.';
  if (input.latestCheckIn.status === 'return_requested' || input.latestCheckIn.status === 'return_recommended') {
    return 'Return conditions are recorded. Conclude the plan deliberately.';
  }

  return 'Material change recorded. Continue measuring only new evidence.';
}

function normalizeDisplayValue(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
