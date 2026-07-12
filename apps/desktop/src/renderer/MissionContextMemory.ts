export interface MissionContextBriefingAnswers {
  readonly missionObjective?: string;
  readonly market?: string;
  readonly marketEnvironment?: string;
  readonly highImpactNews?: string;
  readonly personalReadiness?: string;
  readonly riskParameters?: string;
  readonly successCriteria?: string;
}

export interface MissionContextObservationAnswers {
  readonly observedDirection?: string;
  readonly marketStructure?: string;
  readonly volume?: string;
  readonly liquidityNotes?: string;
  readonly keyLevels?: string;
  readonly directionalHypothesis?: string;
  readonly invalidationEvidence?: string;
  readonly emotionalCheck?: string;
  readonly evidenceReadiness?: 'yes' | 'no';
  readonly operationalSummary?: string;
  readonly additionalObservations?: readonly string[];
}

export interface CommanderContextNote {
  readonly id: string;
  readonly message: string;
  readonly createdAt?: string;
}

export interface MissionContextContradictionFlag {
  readonly id: string;
  readonly sourceRoom: 'ready-room' | 'observation' | 'war-room' | 'debrief';
  readonly targetRoom: 'ready-room' | 'observation' | 'war-room' | 'debrief';
  readonly message: string;
}

export interface MissionContextReadinessFlags {
  readonly briefingComplete: boolean;
  readonly observationComplete: boolean;
  readonly warRoomReady: boolean;
  readonly debriefReady: boolean;
}

export type MissionLifecycleTimingStage =
  | 'idle'
  | 'briefing'
  | 'ready'
  | 'observation'
  | 'authorization'
  | 'deployed'
  | 'return_to_base'
  | 'debrief'
  | 'archived';

export type MissionOperationalTimingState =
  | 'idle'
  | 'waiting'
  | 'quiet'
  | 'active'
  | 'paused'
  | 'blocked'
  | 'abandoned';

export interface MissionLifecycleStageEntry {
  readonly stage: MissionLifecycleTimingStage;
  readonly enteredAt: string;
}

export interface MissionOperationalTiming {
  readonly lifecycleStageEntries: readonly MissionLifecycleStageEntry[];
  readonly operationalState: MissionOperationalTimingState;
  readonly deployedAt?: string;
  readonly planConcludedAt?: string;
  readonly lastCheckInAt?: string;
  readonly quietSince?: string;
  readonly blockedSince?: string;
  readonly pausedAt?: string;
  readonly abandonedAt?: string;
}

export interface MissionContext {
  readonly missionId: string;
  readonly briefing: MissionContextBriefingAnswers;
  readonly observation: MissionContextObservationAnswers;
  readonly commanderNotes: readonly CommanderContextNote[];
  readonly contradictionFlags: readonly MissionContextContradictionFlag[];
  readonly readiness: MissionContextReadinessFlags;
  readonly timing?: MissionOperationalTiming;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface MissionContextSnapshot {
  readonly missionId: string;
  readonly briefing: MissionContextBriefingAnswers;
  readonly observation: MissionContextObservationAnswers;
  readonly commanderNotes: readonly CommanderContextNote[];
  readonly contradictionFlags: readonly MissionContextContradictionFlag[];
  readonly readiness: MissionContextReadinessFlags;
  readonly timing?: MissionOperationalTiming;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export function createEmptyMissionContext(
  missionId: string,
  options: { readonly createdAt?: string } = {},
): MissionContext {
  const timestampFields = options.createdAt
    ? { createdAt: options.createdAt, updatedAt: options.createdAt }
    : {};

  return {
    missionId,
    briefing: {},
    observation: {},
    commanderNotes: [],
    contradictionFlags: [],
    readiness: {
      briefingComplete: false,
      observationComplete: false,
      warRoomReady: false,
      debriefReady: false,
    },
    ...timestampFields,
  };
}

export function updateMissionContextBriefing(
  context: MissionContext,
  answers: MissionContextBriefingAnswers,
  options: { readonly updatedAt?: string } = {},
): MissionContext {
  return withContextUpdate(context, {
    briefing: removeEmptyValues({
      ...context.briefing,
      ...answers,
    }),
  }, options);
}

export function updateMissionContextObservation(
  context: MissionContext,
  answers: MissionContextObservationAnswers,
  options: { readonly updatedAt?: string } = {},
): MissionContext {
  return withContextUpdate(context, {
    observation: removeEmptyValues({
      ...context.observation,
      ...answers,
    }),
  }, options);
}

export function addCommanderContextNote(
  context: MissionContext,
  note: CommanderContextNote,
  options: { readonly updatedAt?: string } = {},
): MissionContext {
  return withContextUpdate(context, {
    commanderNotes: [...context.commanderNotes, note],
  }, options);
}

export function addMissionContextContradiction(
  context: MissionContext,
  contradiction: MissionContextContradictionFlag,
  options: { readonly updatedAt?: string } = {},
): MissionContext {
  if (context.contradictionFlags.some((flag) => flag.id === contradiction.id)) {
    return context;
  }

  return withContextUpdate(context, {
    contradictionFlags: [...context.contradictionFlags, contradiction],
  }, options);
}

export function updateMissionContextReadiness(
  context: MissionContext,
  readiness: Partial<MissionContextReadinessFlags>,
  options: { readonly updatedAt?: string } = {},
): MissionContext {
  return withContextUpdate(context, {
    readiness: {
      ...context.readiness,
      ...readiness,
    },
  }, options);
}

export function snapshotMissionContext(context: MissionContext): MissionContextSnapshot {
  const observationSnapshot = context.observation.additionalObservations
    ? {
      ...context.observation,
      additionalObservations: [...context.observation.additionalObservations],
    }
    : { ...context.observation };
  const timestampFields = {
    ...(context.createdAt ? { createdAt: context.createdAt } : {}),
    ...(context.updatedAt ? { updatedAt: context.updatedAt } : {}),
  };

  return {
    missionId: context.missionId,
    briefing: { ...context.briefing },
    observation: observationSnapshot,
    commanderNotes: context.commanderNotes.map((note) => ({ ...note })),
    contradictionFlags: context.contradictionFlags.map((flag) => ({ ...flag })),
    readiness: { ...context.readiness },
    ...(context.timing ? { timing: cloneMissionOperationalTiming(context.timing) } : {}),
    ...timestampFields,
  };
}

export function recordMissionLifecycleStageEntry(
  context: MissionContext,
  stage: MissionLifecycleTimingStage,
  options: { readonly enteredAt?: string; readonly operationalState?: MissionOperationalTimingState } = {},
): MissionContext {
  const enteredAt = options.enteredAt ?? new Date().toISOString();
  const currentTiming = context.timing ?? createInitialMissionOperationalTiming(context.createdAt ?? enteredAt);
  const latestEntry = currentTiming.lifecycleStageEntries.at(-1);

  if (latestEntry?.stage === stage) {
    return updateMissionOperationalTiming(context, {
      operationalState: options.operationalState ?? currentTiming.operationalState,
    }, { updatedAt: enteredAt });
  }

  return updateMissionOperationalTiming(context, {
    lifecycleStageEntries: [
      ...currentTiming.lifecycleStageEntries,
      { stage, enteredAt },
    ],
    operationalState: options.operationalState ?? deriveOperationalStateForStage(stage),
    ...(stage === 'deployed' && currentTiming.deployedAt === undefined ? { deployedAt: enteredAt } : {}),
    ...(stage === 'return_to_base' && currentTiming.planConcludedAt === undefined ? { planConcludedAt: enteredAt } : {}),
    ...(stage === 'observation' && currentTiming.quietSince === undefined ? { quietSince: enteredAt } : {}),
  }, { updatedAt: enteredAt });
}

export function updateMissionOperationalTiming(
  context: MissionContext,
  timingPatch: Partial<MissionOperationalTiming>,
  options: { readonly updatedAt?: string } = {},
): MissionContext {
  const fallbackTimestamp = options.updatedAt ?? context.updatedAt ?? context.createdAt ?? new Date().toISOString();
  const currentTiming = context.timing ?? createInitialMissionOperationalTiming(context.createdAt ?? fallbackTimestamp);

  return withContextUpdate(context, {
    timing: {
      ...currentTiming,
      ...timingPatch,
      lifecycleStageEntries: timingPatch.lifecycleStageEntries ?? currentTiming.lifecycleStageEntries,
    },
  }, options);
}

export function getMissionLifecycleStageEnteredAt(
  context: MissionContext | undefined,
  stage: MissionLifecycleTimingStage,
): string | undefined {
  return context?.timing?.lifecycleStageEntries
    .filter((entry) => entry.stage === stage)
    .at(-1)?.enteredAt;
}

export function normalizeMissionOperationalTiming(input: unknown): MissionOperationalTiming | undefined {
  if (input === null || typeof input !== 'object') return undefined;
  const candidate = input as Partial<MissionOperationalTiming>;
  const lifecycleStageEntries = Array.isArray(candidate.lifecycleStageEntries)
    ? candidate.lifecycleStageEntries.filter(isMissionLifecycleStageEntry)
    : [];

  if (lifecycleStageEntries.length === 0) return undefined;

  return {
    lifecycleStageEntries,
    operationalState: isMissionOperationalTimingState(candidate.operationalState)
      ? candidate.operationalState
      : deriveOperationalStateForStage(lifecycleStageEntries.at(-1)?.stage ?? 'idle'),
    ...(typeof candidate.deployedAt === 'string' ? { deployedAt: candidate.deployedAt } : {}),
    ...(typeof candidate.planConcludedAt === 'string' ? { planConcludedAt: candidate.planConcludedAt } : {}),
    ...(typeof candidate.lastCheckInAt === 'string' ? { lastCheckInAt: candidate.lastCheckInAt } : {}),
    ...(typeof candidate.quietSince === 'string' ? { quietSince: candidate.quietSince } : {}),
    ...(typeof candidate.blockedSince === 'string' ? { blockedSince: candidate.blockedSince } : {}),
    ...(typeof candidate.pausedAt === 'string' ? { pausedAt: candidate.pausedAt } : {}),
    ...(typeof candidate.abandonedAt === 'string' ? { abandonedAt: candidate.abandonedAt } : {}),
  };
}

function withContextUpdate(
  context: MissionContext,
  patch: Partial<Pick<MissionContext, 'briefing' | 'observation' | 'commanderNotes' | 'contradictionFlags' | 'readiness' | 'timing'>>,
  options: { readonly updatedAt?: string },
): MissionContext {
  const updatedAt = options.updatedAt ?? context.updatedAt;
  const timestampField = updatedAt ? { updatedAt } : {};

  return {
    ...context,
    ...patch,
    ...timestampField,
  };
}

function createInitialMissionOperationalTiming(createdAt: string): MissionOperationalTiming {
  return {
    lifecycleStageEntries: [{ stage: 'idle', enteredAt: createdAt }],
    operationalState: 'idle',
  };
}

function cloneMissionOperationalTiming(timing: MissionOperationalTiming): MissionOperationalTiming {
  return {
    lifecycleStageEntries: timing.lifecycleStageEntries.map((entry) => ({ ...entry })),
    operationalState: timing.operationalState,
    ...(timing.deployedAt ? { deployedAt: timing.deployedAt } : {}),
    ...(timing.planConcludedAt ? { planConcludedAt: timing.planConcludedAt } : {}),
    ...(timing.lastCheckInAt ? { lastCheckInAt: timing.lastCheckInAt } : {}),
    ...(timing.quietSince ? { quietSince: timing.quietSince } : {}),
    ...(timing.blockedSince ? { blockedSince: timing.blockedSince } : {}),
    ...(timing.pausedAt ? { pausedAt: timing.pausedAt } : {}),
    ...(timing.abandonedAt ? { abandonedAt: timing.abandonedAt } : {}),
  };
}

function deriveOperationalStateForStage(stage: MissionLifecycleTimingStage): MissionOperationalTimingState {
  if (stage === 'idle' || stage === 'briefing' || stage === 'ready') return 'waiting';
  if (stage === 'observation') return 'quiet';
  if (stage === 'authorization') return 'blocked';
  if (stage === 'deployed') return 'active';
  if (stage === 'return_to_base' || stage === 'debrief') return 'paused';
  return 'idle';
}

function isMissionLifecycleStageEntry(value: unknown): value is MissionLifecycleStageEntry {
  if (value === null || typeof value !== 'object') return false;
  const entry = value as Partial<MissionLifecycleStageEntry>;
  return isMissionLifecycleTimingStage(entry.stage) && typeof entry.enteredAt === 'string';
}

function isMissionLifecycleTimingStage(value: unknown): value is MissionLifecycleTimingStage {
  return value === 'idle'
    || value === 'briefing'
    || value === 'ready'
    || value === 'observation'
    || value === 'authorization'
    || value === 'deployed'
    || value === 'return_to_base'
    || value === 'debrief'
    || value === 'archived';
}

function isMissionOperationalTimingState(value: unknown): value is MissionOperationalTimingState {
  return value === 'idle'
    || value === 'waiting'
    || value === 'quiet'
    || value === 'active'
    || value === 'paused'
    || value === 'blocked'
    || value === 'abandoned';
}

function removeEmptyValues<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => (
      typeof value !== 'string' || value.trim().length > 0
    )),
  ) as T;
}
