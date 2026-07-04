import type { MissionContext, MissionContextContradictionFlag } from './MissionContextMemory';

export type MissionIntelligenceConfidenceLevel = 'incomplete' | 'forming' | 'sufficient' | 'complete';

export interface MissionIntelligenceAuthorizationInput {
  readonly decision?: 'approved' | 'denied';
  readonly reason?: string;
  readonly operatorJustification?: string;
  readonly invalidation?: string;
}

export interface MissionIntelligenceDebriefInput {
  readonly behaviorSummary?: string;
  readonly disciplineNotes?: string;
  readonly lesson?: string;
}

export interface MissionIntelligencePackageInput {
  readonly missionId: string;
  readonly missionName?: string;
  readonly currentState?: string;
  readonly fallbackObjective?: string;
  readonly missionContext?: MissionContext;
  readonly authorization?: MissionIntelligenceAuthorizationInput;
  readonly debrief?: MissionIntelligenceDebriefInput;
  readonly archiveReference?: string;
  readonly guardianNotes?: readonly string[];
}

export interface MissionIntelligenceConfidence {
  readonly score: number;
  readonly level: MissionIntelligenceConfidenceLevel;
  readonly reasons: readonly string[];
}

export interface MissionIntelligencePackage {
  readonly missionId: string;
  readonly missionName?: string;
  readonly currentState?: string;
  readonly missionObjective?: string;
  readonly market?: string;
  readonly session?: string;
  readonly marketEnvironment?: string;
  readonly economicEvents?: string;
  readonly riskLimit?: string;
  readonly operatorReadiness?: string;
  readonly successCriteria?: string;
  readonly trend?: string;
  readonly structure?: string;
  readonly liquidity?: string;
  readonly volume?: string;
  readonly importantLevels?: string;
  readonly directionalHypothesis?: string;
  readonly invalidation?: string;
  readonly confidence: MissionIntelligenceConfidence;
  readonly contradictions: readonly MissionContextContradictionFlag[];
  readonly missingEvidence: readonly MissionIntelligenceMissingEvidence[];
  readonly commanderNotes: readonly string[];
  readonly guardianNotes: readonly string[];
  readonly observationSummary?: string;
  readonly authorizationSummary?: string;
  readonly debriefSummary?: string;
  readonly missionResult?: string;
  readonly archiveReference?: string;
}

export interface MissionIntelligenceMissingEvidence {
  readonly field: MissionIntelligenceEvidenceField;
  readonly label: string;
  readonly room: 'ready-room' | 'observation' | 'war-room' | 'debrief' | 'archive';
}

export type MissionIntelligenceEvidenceField =
  | 'missionObjective'
  | 'market'
  | 'marketEnvironment'
  | 'economicEvents'
  | 'riskLimit'
  | 'operatorReadiness'
  | 'successCriteria'
  | 'trend'
  | 'structure'
  | 'liquidity'
  | 'volume'
  | 'importantLevels'
  | 'directionalHypothesis'
  | 'invalidation'
  | 'observationSummary'
  | 'authorizationSummary'
  | 'debriefSummary';

export type MissionIntelligenceSummaryMode = 'observation' | 'authorization' | 'debrief' | 'archive';

const evidenceRequirements: readonly MissionIntelligenceMissingEvidence[] = [
  { field: 'missionObjective', label: 'Mission objective', room: 'ready-room' },
  { field: 'market', label: 'Market', room: 'ready-room' },
  { field: 'marketEnvironment', label: 'Market environment', room: 'ready-room' },
  { field: 'economicEvents', label: 'Economic events', room: 'ready-room' },
  { field: 'riskLimit', label: 'Risk limit', room: 'ready-room' },
  { field: 'operatorReadiness', label: 'Operator readiness', room: 'ready-room' },
  { field: 'successCriteria', label: 'Success criteria', room: 'ready-room' },
  { field: 'trend', label: 'Observed direction', room: 'observation' },
  { field: 'structure', label: 'Market structure', room: 'observation' },
  { field: 'liquidity', label: 'Liquidity', room: 'observation' },
  { field: 'volume', label: 'Volume', room: 'observation' },
  { field: 'importantLevels', label: 'Important levels', room: 'observation' },
  { field: 'directionalHypothesis', label: 'Directional hypothesis', room: 'observation' },
  { field: 'invalidation', label: 'Invalidation evidence', room: 'observation' },
  { field: 'observationSummary', label: 'Observation summary', room: 'observation' },
];

export function buildMissionIntelligencePackage(input: MissionIntelligencePackageInput): MissionIntelligencePackage {
  const briefing = input.missionContext?.briefing;
  const observation = input.missionContext?.observation;
  const authorizationSummary = buildAuthorizationSummary(input.authorization);
  const debriefSummary = buildDebriefSummary(input.debrief);
  const missionResult = buildMissionResult(input.currentState, input.authorization, input.debrief);
  const missionObjective = briefing?.missionObjective ?? input.fallbackObjective;
  const invalidation = observation?.invalidationEvidence ?? input.authorization?.invalidation;
  const basePackage: Omit<MissionIntelligencePackage, 'missingEvidence' | 'confidence'> = {
    missionId: input.missionId,
    contradictions: input.missionContext?.contradictionFlags ?? [],
    commanderNotes: input.missionContext?.commanderNotes.map((note) => note.message) ?? [],
    guardianNotes: input.guardianNotes ?? [],
    ...(hasText(input.missionName) ? { missionName: input.missionName } : {}),
    ...(hasText(input.currentState) ? { currentState: input.currentState, session: input.currentState } : {}),
    ...(hasText(missionObjective) ? { missionObjective } : {}),
    ...(hasText(briefing?.market) ? { market: briefing.market } : {}),
    ...(hasText(briefing?.marketEnvironment) ? { marketEnvironment: briefing.marketEnvironment } : {}),
    ...(hasText(briefing?.highImpactNews) ? { economicEvents: briefing.highImpactNews } : {}),
    ...(hasText(briefing?.riskParameters) ? { riskLimit: briefing.riskParameters } : {}),
    ...(hasText(briefing?.personalReadiness) ? { operatorReadiness: briefing.personalReadiness } : {}),
    ...(hasText(briefing?.successCriteria) ? { successCriteria: briefing.successCriteria } : {}),
    ...(hasText(observation?.observedDirection) ? { trend: observation.observedDirection } : {}),
    ...(hasText(observation?.marketStructure) ? { structure: observation.marketStructure } : {}),
    ...(hasText(observation?.liquidityNotes) ? { liquidity: observation.liquidityNotes } : {}),
    ...(hasText(observation?.volume) ? { volume: observation.volume } : {}),
    ...(hasText(observation?.keyLevels) ? { importantLevels: observation.keyLevels } : {}),
    ...(hasText(observation?.directionalHypothesis) ? { directionalHypothesis: observation.directionalHypothesis } : {}),
    ...(hasText(invalidation) ? { invalidation } : {}),
    ...(hasText(observation?.operationalSummary) ? { observationSummary: observation.operationalSummary } : {}),
    ...(hasText(authorizationSummary) ? { authorizationSummary } : {}),
    ...(hasText(debriefSummary) ? { debriefSummary } : {}),
    ...(hasText(missionResult) ? { missionResult } : {}),
    ...(hasText(input.archiveReference) ? { archiveReference: input.archiveReference } : {}),
  };
  const missingEvidence = detectMissingEvidence(basePackage);
  const confidence = estimateMissionIntelligenceConfidence(basePackage, missingEvidence);

  return {
    ...basePackage,
    confidence,
    missingEvidence,
  };
}

export function detectMissingEvidence(
  missionPackage: Omit<MissionIntelligencePackage, 'missingEvidence' | 'confidence'>,
): readonly MissionIntelligenceMissingEvidence[] {
  return evidenceRequirements.filter((requirement) => !hasText(missionPackage[requirement.field]));
}

export function estimateMissionIntelligenceConfidence(
  missionPackage: Omit<MissionIntelligencePackage, 'missingEvidence' | 'confidence'>,
  missingEvidence = detectMissingEvidence(missionPackage),
): MissionIntelligenceConfidence {
  const total = evidenceRequirements.length;
  const answered = total - missingEvidence.length;
  const contradictionPenalty = Math.min(missionPackage.contradictions.length * 7, 21);
  const riskPenalty = hasText(missionPackage.riskLimit) ? 0 : 8;
  const score = Math.max(0, Math.min(100, Math.round((answered / total) * 100) - contradictionPenalty - riskPenalty));
  const reasons = [
    `${answered} of ${total} intelligence fields present`,
    ...(missionPackage.contradictions.length > 0 ? [`${missionPackage.contradictions.length} contradiction(s) require review`] : []),
    ...(!hasText(missionPackage.riskLimit) ? ['Risk limit is not clear'] : []),
  ];

  return {
    score,
    level: getConfidenceLevel(score),
    reasons,
  };
}

export function buildCommanderIntelligenceSummary(
  missionPackage: MissionIntelligencePackage,
  mode: MissionIntelligenceSummaryMode,
): readonly string[] {
  if (mode === 'authorization') {
    return compact([
      missionPackage.missionObjective ? `Objective: ${missionPackage.missionObjective}` : undefined,
      missionPackage.observationSummary ? `Observation: ${missionPackage.observationSummary}` : undefined,
      missionPackage.riskLimit ? `Risk boundary: ${missionPackage.riskLimit}` : undefined,
      missionPackage.invalidation ? `Invalidation: ${missionPackage.invalidation}` : undefined,
      `Confidence: ${missionPackage.confidence.level} (${missionPackage.confidence.score}%)`,
    ]);
  }

  if (mode === 'debrief') {
    return compact([
      missionPackage.missionObjective ? `Original plan: ${missionPackage.missionObjective}` : undefined,
      missionPackage.directionalHypothesis ? `Authorized idea: ${missionPackage.directionalHypothesis}` : undefined,
      missionPackage.authorizationSummary ? `Authorization: ${missionPackage.authorizationSummary}` : undefined,
      missionPackage.debriefSummary ? `Debrief: ${missionPackage.debriefSummary}` : undefined,
    ]);
  }

  if (mode === 'archive') {
    return compact([
      missionPackage.missionName ? `Campaign: ${missionPackage.missionName}` : undefined,
      missionPackage.missionResult ? `Result: ${missionPackage.missionResult}` : undefined,
      missionPackage.archiveReference ? `Archive reference: ${missionPackage.archiveReference}` : undefined,
      `Intelligence confidence: ${missionPackage.confidence.level}`,
    ]);
  }

  return compact([
    missionPackage.marketEnvironment ? `Environment: ${missionPackage.marketEnvironment}` : undefined,
    missionPackage.trend ? `Direction: ${missionPackage.trend}` : undefined,
    missionPackage.structure ? `Structure: ${missionPackage.structure}` : undefined,
    missionPackage.directionalHypothesis ? `Hypothesis: ${missionPackage.directionalHypothesis}` : undefined,
    missionPackage.missingEvidence.length > 0 ? `Remaining unknowns: ${missionPackage.missingEvidence.slice(0, 3).map((item) => item.label).join(', ')}` : 'Observation file is complete enough for review.',
  ]);
}

export function buildAuthorizationIntelligenceQuestion(missionPackage: MissionIntelligencePackage): string {
  if (missionPackage.missingEvidence.length > 0) {
    const missing = missionPackage.missingEvidence.slice(0, 3).map((item) => item.label).join(', ');
    return `Before authorization, resolve or acknowledge: ${missing}.`;
  }

  return 'Based on this intelligence, why should Headquarters authorize execution?';
}

export function buildDebriefIntelligenceComparison(missionPackage: MissionIntelligencePackage): readonly string[] {
  return compact([
    missionPackage.missionObjective ? `Original plan: ${missionPackage.missionObjective}` : undefined,
    missionPackage.observationSummary ? `Observation: ${missionPackage.observationSummary}` : undefined,
    missionPackage.authorizationSummary ? `Authorization: ${missionPackage.authorizationSummary}` : undefined,
    missionPackage.debriefSummary ? `Execution review: ${missionPackage.debriefSummary}` : undefined,
    missionPackage.missionResult ? `Outcome: ${missionPackage.missionResult}` : undefined,
  ]);
}

export function serializeMissionIntelligencePackage(missionPackage: MissionIntelligencePackage): MissionIntelligencePackage {
  return {
    ...missionPackage,
    confidence: {
      ...missionPackage.confidence,
      reasons: [...missionPackage.confidence.reasons],
    },
    contradictions: missionPackage.contradictions.map((contradiction) => ({ ...contradiction })),
    missingEvidence: missionPackage.missingEvidence.map((item) => ({ ...item })),
    commanderNotes: [...missionPackage.commanderNotes],
    guardianNotes: [...missionPackage.guardianNotes],
  };
}

function buildAuthorizationSummary(authorization: MissionIntelligenceAuthorizationInput | undefined): string | undefined {
  if (authorization === undefined) return undefined;
  const decision = authorization.decision ? `Decision ${authorization.decision}` : undefined;

  return compact([
    decision,
    authorization.reason,
    authorization.operatorJustification ? `Reasoning: ${authorization.operatorJustification}` : undefined,
  ]).join(' | ') || undefined;
}

function buildDebriefSummary(debrief: MissionIntelligenceDebriefInput | undefined): string | undefined {
  if (debrief === undefined) return undefined;

  return compact([
    debrief.behaviorSummary,
    debrief.disciplineNotes,
    debrief.lesson ? `Lesson: ${debrief.lesson}` : undefined,
  ]).join(' | ') || undefined;
}

function buildMissionResult(
  currentState: string | undefined,
  authorization: MissionIntelligenceAuthorizationInput | undefined,
  debrief: MissionIntelligenceDebriefInput | undefined,
): string | undefined {
  if (currentState === 'archived') return 'Archived';
  if (debrief !== undefined) return 'Debriefed';
  if (authorization?.decision === 'approved') return 'Authorized';
  if (authorization?.decision === 'denied') return 'Authorization denied';
  return undefined;
}

function getConfidenceLevel(score: number): MissionIntelligenceConfidenceLevel {
  if (score >= 90) return 'complete';
  if (score >= 70) return 'sufficient';
  if (score >= 35) return 'forming';
  return 'incomplete';
}

function compact(values: readonly (string | undefined)[]): readonly string[] {
  return values.filter(hasText);
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
