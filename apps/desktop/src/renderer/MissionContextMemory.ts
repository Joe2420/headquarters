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

export interface MissionContext {
  readonly missionId: string;
  readonly briefing: MissionContextBriefingAnswers;
  readonly observation: MissionContextObservationAnswers;
  readonly commanderNotes: readonly CommanderContextNote[];
  readonly contradictionFlags: readonly MissionContextContradictionFlag[];
  readonly readiness: MissionContextReadinessFlags;
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
    ...timestampFields,
  };
}

function withContextUpdate(
  context: MissionContext,
  patch: Partial<Pick<MissionContext, 'briefing' | 'observation' | 'commanderNotes' | 'contradictionFlags' | 'readiness'>>,
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

function removeEmptyValues<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => (
      typeof value !== 'string' || value.trim().length > 0
    )),
  ) as T;
}
