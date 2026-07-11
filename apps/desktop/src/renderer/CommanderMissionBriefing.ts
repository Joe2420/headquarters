export interface MissionBriefingContext {
  readonly missionObjective?: string;
  readonly market?: string;
  readonly marketEnvironment?: string;
  readonly highImpactNews?: string;
  readonly personalReadiness?: string;
  readonly riskParameters?: string;
  readonly successCriteria?: string;
}

export type ReadyRoomBriefingField =
  | 'market'
  | 'marketEnvironment'
  | 'highImpactNews'
  | 'personalReadiness'
  | 'riskParameters'
  | 'successCriteria';

export interface MissionObservationContext {
  readonly marketDirection?: string;
  readonly marketStructure?: string;
  readonly volume?: string;
  readonly liquidity?: string;
  readonly keyLevels?: string;
  readonly bias?: string;
  readonly invalidationEvidence?: string;
  readonly emotionalCheck?: string;
  readonly readiness?: 'yes' | 'no';
  readonly operationalPicture?: string;
  readonly additionalObservations?: readonly string[];
}

export type ObservationInterviewField =
  | 'marketDirection'
  | 'marketStructure'
  | 'volume'
  | 'liquidity'
  | 'keyLevels'
  | 'bias'
  | 'invalidationEvidence'
  | 'emotionalCheck'
  | 'readiness'
  | 'additionalObservation'
  | 'operationalPicture';

export interface ReadyRoomBriefingAnswerResult {
  readonly context: MissionBriefingContext;
  readonly field?: ReadyRoomBriefingField;
  readonly accepted: boolean;
  readonly complete: boolean;
  readonly response: string;
}

export interface ObservationInterviewAnswerResult {
  readonly context: MissionObservationContext;
  readonly field?: ObservationInterviewField;
  readonly accepted: boolean;
  readonly complete: boolean;
  readonly response: string;
}

const readyRoomBriefingQuestions: Record<ReadyRoomBriefingField, string> = {
  market: "Operator. Before Headquarters commits resources, I need today's operational briefing. What market are you trading?",
  marketEnvironment: "Describe today's market environment.",
  highImpactNews: "Are there any scheduled economic events capable of changing today's conditions?",
  personalReadiness: 'Evaluate your current operational condition.',
  riskParameters: "State today's maximum acceptable risk.",
  successCriteria: 'How will Headquarters know this mission was successful?',
};

const observationInterviewQuestions: Record<ObservationInterviewField, string> = {
  marketDirection: 'Observation has begun.\n\nDo not predict. Report only what is visible.\n\nWhat direction is price currently moving?',
  marketStructure: 'What market structure is currently present?',
  volume: "Describe today's volume.",
  liquidity: 'Where is liquidity likely resting?',
  keyLevels: 'What levels are most important today?',
  bias: 'What is your current directional hypothesis?',
  invalidationEvidence: 'What evidence would invalidate your current idea?',
  emotionalCheck: 'Has your emotional state changed since entering Observation?',
  readiness: 'Do you currently possess enough evidence to justify entering the War Room? Answer Yes or No.',
  additionalObservation: 'Continue collecting observations. What new visible evidence has appeared since your last report?',
  operationalPicture: 'Summarize your complete operational picture.',
};

export const readyRoomBriefingCompleteMessage = 'Operational briefing complete.\n\nMission profile accepted.\n\nProceed to Observation Room.';
export const observationInterviewCompleteMessage = 'Observation complete.\n\nThe evidence package is ready for authorization review.\n\nProceed to the War Room.';

export function getNextReadyRoomBriefingField(context: MissionBriefingContext = {}): ReadyRoomBriefingField | undefined {
  if (!hasText(context.market)) return 'market';
  if (!hasText(context.marketEnvironment)) return 'marketEnvironment';
  if (!hasText(context.highImpactNews)) return 'highImpactNews';
  if (!hasText(context.personalReadiness)) return 'personalReadiness';
  if (!hasText(context.riskParameters)) return 'riskParameters';
  if (!hasText(context.successCriteria)) return 'successCriteria';
  return undefined;
}

export function getNextReadyRoomBriefingQuestion(context: MissionBriefingContext = {}): string {
  const field = getNextReadyRoomBriefingField(context);
  return field === undefined ? readyRoomBriefingCompleteMessage : readyRoomBriefingQuestions[field];
}

export function isReadyRoomBriefingComplete(context: MissionBriefingContext = {}): boolean {
  return getNextReadyRoomBriefingField(context) === undefined;
}

export function answerReadyRoomBriefing(
  context: MissionBriefingContext = {},
  answer: string,
): ReadyRoomBriefingAnswerResult {
  const trimmedAnswer = answer.trim();
  const field = getNextReadyRoomBriefingField(context);

  if (field === undefined) {
    return {
      context,
      accepted: true,
      complete: true,
      response: readyRoomBriefingCompleteMessage,
    };
  }

  if (!trimmedAnswer) {
    return {
      context,
      field,
      accepted: false,
      complete: false,
      response: getNextReadyRoomBriefingQuestion(context),
    };
  }

  const nextContext = withReadyRoomAnswer(context, field, trimmedAnswer);
  const complete = isReadyRoomBriefingComplete(nextContext);

  return {
    context: nextContext,
    field,
    accepted: true,
    complete,
    response: complete
      ? readyRoomBriefingCompleteMessage
      : `${getReadyRoomAcknowledgement(field, trimmedAnswer, context)}\n\n${getNextReadyRoomBriefingQuestion(nextContext)}`,
  };
}

export function getNextObservationInterviewField(context: MissionObservationContext = {}): ObservationInterviewField | undefined {
  if (!hasText(context.marketDirection)) return 'marketDirection';
  if (!hasText(context.marketStructure)) return 'marketStructure';
  if (!hasText(context.volume)) return 'volume';
  if (!hasText(context.liquidity)) return 'liquidity';
  if (!hasText(context.keyLevels)) return 'keyLevels';
  if (!hasText(context.bias)) return 'bias';
  if (!hasText(context.invalidationEvidence)) return 'invalidationEvidence';
  if (!hasText(context.emotionalCheck)) return 'emotionalCheck';
  if (context.readiness === 'no') return 'additionalObservation';
  if (context.readiness !== 'yes') return 'readiness';
  if (!hasText(context.operationalPicture)) return 'operationalPicture';
  return undefined;
}

export function getNextObservationInterviewQuestion(context: MissionObservationContext = {}): string {
  const field = getNextObservationInterviewField(context);
  return field === undefined ? observationInterviewCompleteMessage : observationInterviewQuestions[field];
}

export function isObservationInterviewComplete(context: MissionObservationContext = {}): boolean {
  return getNextObservationInterviewField(context) === undefined;
}

export function answerObservationInterview(
  context: MissionObservationContext = {},
  answer: string,
): ObservationInterviewAnswerResult {
  const trimmedAnswer = answer.trim();
  const field = getNextObservationInterviewField(context);

  if (field === undefined) {
    return {
      context,
      accepted: true,
      complete: true,
      response: observationInterviewCompleteMessage,
    };
  }

  if (!trimmedAnswer) {
    return {
      context,
      field,
      accepted: false,
      complete: false,
      response: getNextObservationInterviewQuestion(context),
    };
  }

  if (field === 'readiness') {
    const readiness = parseReadinessAnswer(trimmedAnswer);

    if (readiness === undefined) {
      return {
        context,
        field,
        accepted: false,
        complete: false,
        response: 'Answer Yes or No. Headquarters needs a clear readiness assessment.',
      };
    }

    const nextContext = { ...context, readiness };

    return {
      context: nextContext,
      field,
      accepted: true,
      complete: false,
      response: readiness === 'yes'
      ? `${getObservationCommanderAcknowledgement(field, 'Yes', context)}\n\n${getNextObservationInterviewQuestion(nextContext)}`
      : `${getObservationCommanderAcknowledgement(field, 'No', context)}\n\n${getNextObservationInterviewQuestion(nextContext)}`,
    };
  }

  const nextContext = withObservationAnswer(context, field, trimmedAnswer);
  const complete = isObservationInterviewComplete(nextContext);

  return {
    context: nextContext,
    field,
    accepted: true,
    complete,
    response: complete
      ? observationInterviewCompleteMessage
      : `${getObservationAcknowledgement(field, trimmedAnswer, context)}\n\n${getNextObservationInterviewQuestion(nextContext)}`,
  };
}

function withReadyRoomAnswer(
  context: MissionBriefingContext,
  field: ReadyRoomBriefingField,
  answer: string,
): MissionBriefingContext {
  if (field === 'market') return { ...context, market: answer };
  if (field === 'marketEnvironment') return { ...context, marketEnvironment: answer };
  if (field === 'highImpactNews') return { ...context, highImpactNews: normalizeEconomicEventAnswer(answer) };
  if (field === 'personalReadiness') return { ...context, personalReadiness: answer };
  if (field === 'riskParameters') return { ...context, riskParameters: answer };
  return { ...context, successCriteria: answer };
}

function withObservationAnswer(
  context: MissionObservationContext,
  field: ObservationInterviewField,
  answer: string,
): MissionObservationContext {
  if (field === 'marketDirection') return { ...context, marketDirection: answer };
  if (field === 'marketStructure') return { ...context, marketStructure: answer };
  if (field === 'volume') return { ...context, volume: answer };
  if (field === 'liquidity') return { ...context, liquidity: answer };
  if (field === 'keyLevels') return { ...context, keyLevels: answer };
  if (field === 'bias') return { ...context, bias: answer };
  if (field === 'invalidationEvidence') return { ...context, invalidationEvidence: answer };
  if (field === 'emotionalCheck') return { ...context, emotionalCheck: answer };
  if (field === 'additionalObservation') {
    const { readiness, ...contextWithoutReadiness } = context;
    void readiness;

    return {
      ...contextWithoutReadiness,
      additionalObservations: [...(context.additionalObservations ?? []), answer],
    };
  }

  return { ...context, operationalPicture: answer };
}

function getReadyRoomAcknowledgement(
  field: ReadyRoomBriefingField,
  answer: string,
  context: MissionBriefingContext,
): string {
  return getReadyRoomCommanderAcknowledgement(field, answer, context);
}

function getObservationAcknowledgement(
  field: ObservationInterviewField,
  answer: string,
  context: MissionObservationContext,
): string {
  return getObservationCommanderAcknowledgement(field, answer, context);
}

function parseReadinessAnswer(answer: string): 'yes' | 'no' | undefined {
  const parsed = parseAffirmativeNegativeAnswer(answer);
  if (parsed === 'yes') return 'yes';
  if (parsed === 'no') return 'no';
  return undefined;
}

export function parseAffirmativeNegativeAnswer(answer: string): 'yes' | 'no' | undefined {
  const normalized = answer.trim().toLowerCase();
  if (/^(yes|y|yep|yeah|affirmative|ready)\b/.test(normalized)) return 'yes';
  if (/^(no|n|nope|none|no news|negative|not yet|nothing|n\/a)\b/.test(normalized)) return 'no';
  return undefined;
}

export function normalizeEconomicEventAnswer(answer: string): string {
  const parsed = parseAffirmativeNegativeAnswer(answer);
  if (parsed === 'no') return 'None';
  return answer.trim();
}

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}
import {
  getObservationCommanderAcknowledgement,
  getReadyRoomCommanderAcknowledgement,
} from './CommanderConversation';
