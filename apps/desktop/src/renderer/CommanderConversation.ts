import type {
  MissionBriefingContext,
  MissionObservationContext,
  ObservationInterviewField,
  ReadyRoomBriefingField,
} from './CommanderMissionBriefing';

export type CommanderConversationTone =
  | 'briefing'
  | 'observation'
  | 'warning'
  | 'discipline'
  | 'authorization'
  | 'debrief'
  | 'recognition';

export type MissionIntelligenceField =
  | 'missionObjective'
  | 'market'
  | 'marketEnvironment'
  | 'economicEvents'
  | 'readiness'
  | 'riskLimit'
  | 'successCriteria'
  | 'trend'
  | 'marketStructure'
  | 'volume'
  | 'liquidity'
  | 'importantLevels'
  | 'directionalHypothesis'
  | 'invalidation'
  | 'emotionalState'
  | 'operationalPicture';

export interface MissionIntelligence {
  readonly missionObjective?: string;
  readonly market?: string;
  readonly marketEnvironment?: string;
  readonly economicEvents?: string;
  readonly readiness?: string;
  readonly riskLimit?: string;
  readonly successCriteria?: string;
  readonly trend?: string;
  readonly marketStructure?: string;
  readonly volume?: string;
  readonly liquidity?: string;
  readonly importantLevels?: string;
  readonly directionalHypothesis?: string;
  readonly invalidation?: string;
  readonly emotionalState?: string;
  readonly operationalPicture?: string;
}

export interface CommanderConversationState {
  readonly tone: CommanderConversationTone;
  readonly intelligence: MissionIntelligence;
  readonly answeredFields: readonly MissionIntelligenceField[];
  readonly missingFields: readonly MissionIntelligenceField[];
  readonly challenge?: string;
}

interface CommanderConversationContext {
  readonly briefing?: MissionBriefingContext;
  readonly observation?: MissionObservationContext;
}

const readyRoomFieldToIntelligenceField: Record<ReadyRoomBriefingField, MissionIntelligenceField> = {
  missionObjective: 'missionObjective',
  market: 'market',
  marketEnvironment: 'marketEnvironment',
  highImpactNews: 'economicEvents',
  personalReadiness: 'readiness',
  riskParameters: 'riskLimit',
  successCriteria: 'successCriteria',
};

const observationFieldToIntelligenceField: Partial<Record<ObservationInterviewField, MissionIntelligenceField>> = {
  marketDirection: 'trend',
  marketStructure: 'marketStructure',
  volume: 'volume',
  liquidity: 'liquidity',
  keyLevels: 'importantLevels',
  bias: 'directionalHypothesis',
  invalidationEvidence: 'invalidation',
  emotionalCheck: 'emotionalState',
  operationalPicture: 'operationalPicture',
};

const requiredIntelligenceFields: readonly MissionIntelligenceField[] = [
  'missionObjective',
  'market',
  'marketEnvironment',
  'economicEvents',
  'readiness',
  'riskLimit',
  'successCriteria',
  'trend',
  'marketStructure',
  'volume',
  'liquidity',
  'importantLevels',
  'directionalHypothesis',
  'invalidation',
  'emotionalState',
  'operationalPicture',
];

const readyAcknowledgements: Record<ReadyRoomBriefingField, readonly string[]> = {
  missionObjective: [
    'Mission objective received.',
    'Objective accepted into the mission profile.',
    'Headquarters has the purpose of the operation.',
  ],
  market: [
    'Market theater recorded.',
    'Operating market logged.',
    'The mission file now has its market.',
  ],
  marketEnvironment: [
    'Market environment acknowledged.',
    'Conditions recorded. We will compare them against Observation.',
    'Environmental assessment received.',
  ],
  highImpactNews: [
    'Economic calendar noted.',
    'Scheduled events acknowledged.',
    'News risk registered for the mission file.',
  ],
  personalReadiness: [
    'Operational condition recorded.',
    'Personal readiness acknowledged.',
    'Commander has your condition on file.',
  ],
  riskParameters: [
    'Risk ceiling accepted.',
    'Risk limit entered. Headquarters will hold that boundary.',
    'Maximum risk recorded as an operating restriction.',
  ],
  successCriteria: [
    'Success criteria recorded.',
    'Mission standard accepted.',
    'Headquarters now knows what success means today.',
  ],
};

const observationAcknowledgements: Record<ObservationInterviewField, readonly string[]> = {
  marketDirection: [
    'Direction observed.',
    'Visible direction recorded.',
    'Trend report received.',
  ],
  marketStructure: [
    'Structure recorded.',
    'Market structure acknowledged.',
    'The structure report is in the mission file.',
  ],
  volume: [
    'Volume assessment received.',
    'Volume condition logged.',
    'Volume is now part of the evidence picture.',
  ],
  liquidity: [
    'Liquidity location noted.',
    'Liquidity assessment recorded.',
    'Likely liquidity is marked for review.',
  ],
  keyLevels: [
    'Key levels recorded.',
    'Levels accepted into the observation file.',
    'Important levels are now visible to Headquarters.',
  ],
  bias: [
    'Hypothesis received. Hypotheses are not evidence.',
    'Directional hypothesis recorded. It remains provisional.',
    'Bias accepted as a hypothesis only.',
  ],
  invalidationEvidence: [
    'Invalidation condition recorded.',
    'Evidence threshold accepted.',
    'The mission now has a condition that proves the idea wrong.',
  ],
  emotionalCheck: [
    'Emotional state recorded. Evidence remains primary.',
    'Condition acknowledged. The room remains quiet.',
    'Emotional update received. Stay with what is visible.',
  ],
  readiness: [
    'Readiness assessment received.',
    'Evidence readiness recorded.',
    'Headquarters has your readiness position.',
  ],
  additionalObservation: [
    'Additional evidence logged.',
    'New observation accepted.',
    'Evidence picture updated.',
  ],
  operationalPicture: [
    'Operational picture received.',
    'Complete observation summary recorded.',
    'Headquarters has the full picture.',
  ],
};

export function buildMissionIntelligence(context: CommanderConversationContext): MissionIntelligence {
  const briefing = context.briefing ?? {};
  const observation = context.observation ?? {};

  return {
    ...(hasText(briefing.missionObjective) ? { missionObjective: briefing.missionObjective } : {}),
    ...(hasText(briefing.market) ? { market: briefing.market } : {}),
    ...(hasText(briefing.marketEnvironment) ? { marketEnvironment: briefing.marketEnvironment } : {}),
    ...(hasText(briefing.highImpactNews) ? { economicEvents: briefing.highImpactNews } : {}),
    ...(hasText(briefing.personalReadiness) ? { readiness: briefing.personalReadiness } : {}),
    ...(hasText(briefing.riskParameters) ? { riskLimit: briefing.riskParameters } : {}),
    ...(hasText(briefing.successCriteria) ? { successCriteria: briefing.successCriteria } : {}),
    ...(hasText(observation.marketDirection) ? { trend: observation.marketDirection } : {}),
    ...(hasText(observation.marketStructure) ? { marketStructure: observation.marketStructure } : {}),
    ...(hasText(observation.volume) ? { volume: observation.volume } : {}),
    ...(hasText(observation.liquidity) ? { liquidity: observation.liquidity } : {}),
    ...(hasText(observation.keyLevels) ? { importantLevels: observation.keyLevels } : {}),
    ...(hasText(observation.bias) ? { directionalHypothesis: observation.bias } : {}),
    ...(hasText(observation.invalidationEvidence) ? { invalidation: observation.invalidationEvidence } : {}),
    ...(hasText(observation.emotionalCheck)
      ? { emotionalState: observation.emotionalCheck }
      : hasText(briefing.personalReadiness)
        ? { emotionalState: briefing.personalReadiness }
        : {}),
    ...(hasText(observation.operationalPicture) ? { operationalPicture: observation.operationalPicture } : {}),
  };
}

export function buildCommanderConversationState(
  context: CommanderConversationContext,
  tone: CommanderConversationTone,
): CommanderConversationState {
  const intelligence = buildMissionIntelligence(context);
  const answeredFields = requiredIntelligenceFields.filter((field) => hasText(intelligence[field]));
  const missingFields = requiredIntelligenceFields.filter((field) => !hasText(intelligence[field]));
  const challenge = buildCommanderChallenge(intelligence);

  return {
    tone,
    intelligence,
    answeredFields,
    missingFields,
    ...(challenge ? { challenge } : {}),
  };
}

export function getReadyRoomCommanderAcknowledgement(
  field: ReadyRoomBriefingField,
  answer: string,
  context: MissionBriefingContext = {},
): string {
  const base = selectVariant(readyAcknowledgements[field], field, answer);
  const notes = getReadyRoomContextNotes(field, answer, context);

  return joinCommanderLines([base, ...notes]);
}

export function getObservationCommanderAcknowledgement(
  field: ObservationInterviewField,
  answer: string,
  context: MissionObservationContext = {},
  briefing: MissionBriefingContext = {},
): string {
  const base = selectVariant(observationAcknowledgements[field], field, answer);
  const notes = getObservationContextNotes(field, answer, context, briefing);

  return joinCommanderLines([base, ...notes]);
}

export function getMissionIntelligenceFieldForReadyRoom(
  field: ReadyRoomBriefingField,
): MissionIntelligenceField {
  return readyRoomFieldToIntelligenceField[field];
}

export function getMissionIntelligenceFieldForObservation(
  field: ObservationInterviewField,
): MissionIntelligenceField | undefined {
  return observationFieldToIntelligenceField[field];
}

export function buildCommanderChallenge(intelligence: MissionIntelligence): string | undefined {
  const environment = normalize(intelligence.marketEnvironment);
  const structure = normalize(intelligence.marketStructure);
  const volume = normalize(intelligence.volume);
  const readiness = normalize(intelligence.readiness);
  const risk = normalize(intelligence.riskLimit);
  const hypothesis = normalize(intelligence.directionalHypothesis);
  const invalidation = normalize(intelligence.invalidation);

  if (/\b(range|ranging|sideways)\b/.test(environment) && /\b(higher highs|lower lows|trend|expansion)\b/.test(structure)) {
    return 'Your Observation structure conflicts with the earlier range briefing. Explain which condition changed.';
  }

  if (/\b(tired|stressed|distracted)\b/.test(readiness) && isHighRisk(risk)) {
    return 'Your condition does not support elevated risk. State the restriction that protects execution.';
  }

  if (/\b(long|short|bullish|bearish|up|down)\b/.test(hypothesis) && !hasText(invalidation)) {
    return 'A hypothesis without invalidation is not actionable. Define what proves it wrong.';
  }

  if (/\b(strong trend|trending|expansion)\b/.test(structure) && /\b(low|thin|weak|fading)\b/.test(volume)) {
    return 'Structure and volume do not fully agree. Confirm whether momentum is supported by evidence.';
  }

  return undefined;
}

function getReadyRoomContextNotes(
  field: ReadyRoomBriefingField,
  answer: string,
  context: MissionBriefingContext,
): readonly string[] {
  if (field === 'highImpactNews' && hasMeaningfulNews(answer)) {
    return ['Account for event volatility before authorization.'];
  }

  if (field === 'personalReadiness' && /\b(tired|stressed|distracted)\b/i.test(answer)) {
    return ['Guardian discipline applies today. Your risk must match your condition.'];
  }

  if (field === 'riskParameters' && /\b(tired|stressed|distracted)\b/i.test(context.personalReadiness ?? '') && isHighRisk(answer)) {
    return ['That risk conflicts with your condition. Reduce exposure or explain the restriction.'];
  }

  return [];
}

function getObservationContextNotes(
  field: ObservationInterviewField,
  answer: string,
  context: MissionObservationContext,
  briefing: MissionBriefingContext,
): readonly string[] {
  if (field === 'marketStructure' && /\b(range|ranging|sideways)\b/i.test(briefing.marketEnvironment ?? '') && /\b(higher highs|lower lows|trend|expansion)\b/i.test(answer)) {
    return ['This differs from your earlier range briefing. Treat it as changed conditions, not certainty.'];
  }

  if (field === 'bias') {
    return ['Hypotheses are not evidence. Continue collecting observations. The War Room requires evidence, not preference.'];
  }

  if (field === 'volume' && hasText(context.marketStructure)) {
    return [`Compare volume against the structure you reported: ${context.marketStructure}.`];
  }

  if (field === 'readiness' && /^no$/i.test(answer.trim())) {
    return ['No is accepted. Headquarters will not authorize movement on weak evidence.'];
  }

  if (field === 'readiness' && /^yes$/i.test(answer.trim()) && hasText(context.bias)) {
    return [`Your hypothesis remains provisional: ${context.bias}. Summarize the complete picture before War Room.`];
  }

  return [];
}

function selectVariant(variants: readonly string[], seed: string, answer: string): string {
  const index = Math.abs(hash(`${seed}:${answer.trim().toLowerCase()}`)) % variants.length;
  return variants[index] ?? variants[0] ?? 'Acknowledged.';
}

function joinCommanderLines(lines: readonly string[]): string {
  return lines.filter(hasText).join('\n\n');
}

function hasMeaningfulNews(value: string): boolean {
  return hasText(value) && !/^(none|no|nothing|n\/a)$/i.test(value.trim());
}

function isHighRisk(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch?.[1] !== undefined && Number(percentMatch[1]) > 1) return true;

  const rMatch = normalized.match(/(\d+(?:\.\d+)?)\s*r\b/);
  return rMatch?.[1] !== undefined && Number(rMatch[1]) > 2;
}

function hash(value: string): number {
  return value.split('').reduce((total, character) => (
    ((total << 5) - total) + character.charCodeAt(0)
  ), 0);
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
