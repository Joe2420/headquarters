export type JournalReflectionMode =
  | 'quick_capture'
  | 'daily_reflection'
  | 'mission_debrief_extension'
  | 'trade_review'
  | 'behavior_review'
  | 'recovery_reflection'
  | 'doctrine_clarification'
  | 'growth_reflection';

export type JournalReflectionDimension =
  | 'what_happened'
  | 'what_was_observed'
  | 'what_was_decided'
  | 'what_behavior_occurred'
  | 'what_emotion_or_condition_was_present'
  | 'what_rule_or_commitment_applied'
  | 'what_went_well'
  | 'what_should_not_repeat'
  | 'what_was_learned'
  | 'what_will_change'
  | 'what_evidence_supports_the_lesson'
  | 'what_remains_uncertain';

export type JournalReflectionCompletionState = 'not_started' | 'in_progress' | 'clarification_required' | 'complete';

export interface JournalReflectionQuestion {
  readonly dimension: JournalReflectionDimension;
  readonly prompt: string;
  readonly required: boolean;
}

export interface JournalReflectionKnownContext {
  readonly dimension: JournalReflectionDimension;
  readonly summary: string;
  readonly source: string;
}

export interface JournalReflectionAnswer {
  readonly dimension: JournalReflectionDimension;
  readonly answer: string;
  readonly skipped?: boolean | undefined;
}

export interface JournalReflectionPlanInput {
  readonly reflectionId: string;
  readonly mode: JournalReflectionMode;
  readonly sourceRecordId: string;
  readonly linkedMissionId?: string | undefined;
  readonly knownContext?: readonly JournalReflectionKnownContext[] | undefined;
  readonly answers?: readonly JournalReflectionAnswer[] | undefined;
}

export interface JournalReflectionPlan {
  readonly reflectionId: string;
  readonly mode: JournalReflectionMode;
  readonly sourceRecordId: string;
  readonly linkedMissionId?: string | undefined;
  readonly knownContext: readonly JournalReflectionKnownContext[];
  readonly requiredDimensions: readonly JournalReflectionDimension[];
  readonly optionalDimensions: readonly JournalReflectionDimension[];
  readonly activeQuestion?: JournalReflectionQuestion | undefined;
  readonly completedDimensions: readonly JournalReflectionDimension[];
  readonly missingDimensions: readonly JournalReflectionDimension[];
  readonly contradictions: readonly string[];
  readonly completionState: JournalReflectionCompletionState;
  readonly nextAction: 'answer_active_question' | 'clarify_contradiction' | 'complete_reflection';
}

const questions: Readonly<Record<JournalReflectionDimension, string>> = {
  what_happened: 'What happened?',
  what_was_observed: 'What did you observe?',
  what_was_decided: 'What did you decide?',
  what_behavior_occurred: 'What behavior occurred?',
  what_emotion_or_condition_was_present: 'What condition was present while you acted?',
  what_rule_or_commitment_applied: 'What rule or commitment applied?',
  what_went_well: 'What went well?',
  what_should_not_repeat: 'What should not repeat?',
  what_was_learned: 'What lesson is supported by evidence?',
  what_will_change: 'What will change next time?',
  what_evidence_supports_the_lesson: 'What evidence supports that lesson?',
  what_remains_uncertain: 'What remains uncertain?',
};

const modeDimensions: Readonly<Record<JournalReflectionMode, {
  readonly required: readonly JournalReflectionDimension[];
  readonly optional: readonly JournalReflectionDimension[];
}>> = {
  quick_capture: {
    required: ['what_happened'],
    optional: ['what_remains_uncertain'],
  },
  daily_reflection: {
    required: ['what_behavior_occurred', 'what_went_well', 'what_should_not_repeat'],
    optional: ['what_emotion_or_condition_was_present', 'what_will_change'],
  },
  mission_debrief_extension: {
    required: ['what_was_observed', 'what_was_decided', 'what_behavior_occurred', 'what_was_learned'],
    optional: ['what_remains_uncertain'],
  },
  trade_review: {
    required: ['what_was_decided', 'what_behavior_occurred', 'what_rule_or_commitment_applied', 'what_evidence_supports_the_lesson'],
    optional: ['what_emotion_or_condition_was_present', 'what_went_well', 'what_should_not_repeat'],
  },
  behavior_review: {
    required: ['what_behavior_occurred', 'what_should_not_repeat', 'what_will_change'],
    optional: ['what_emotion_or_condition_was_present'],
  },
  recovery_reflection: {
    required: ['what_happened', 'what_behavior_occurred', 'what_will_change', 'what_evidence_supports_the_lesson'],
    optional: ['what_remains_uncertain'],
  },
  doctrine_clarification: {
    required: ['what_rule_or_commitment_applied', 'what_evidence_supports_the_lesson', 'what_remains_uncertain'],
    optional: ['what_was_learned'],
  },
  growth_reflection: {
    required: ['what_behavior_occurred', 'what_went_well', 'what_evidence_supports_the_lesson'],
    optional: ['what_will_change'],
  },
};

export function buildJournalReflectionPlan(input: JournalReflectionPlanInput): JournalReflectionPlan {
  const knownContext = input.knownContext?.map((context) => ({ ...context })) ?? [];
  const knownDimensions = new Set(knownContext.map((context) => context.dimension));
  const answers = input.answers?.map((answer) => ({ ...answer })) ?? [];
  const answeredDimensions = new Set(
    answers
      .filter((answer) => answer.skipped !== true && answer.answer.trim().length > 0)
      .map((answer) => answer.dimension),
  );
  const skippedDimensions = new Set(answers.filter((answer) => answer.skipped === true).map((answer) => answer.dimension));
  const definition = modeDimensions[input.mode];
  const requiredDimensions = definition.required.filter((dimension) => !knownDimensions.has(dimension));
  const optionalDimensions = definition.optional.filter((dimension) => !knownDimensions.has(dimension));
  const completedDimensions = [...new Set([...knownDimensions, ...answeredDimensions])] as JournalReflectionDimension[];
  const missingDimensions = requiredDimensions.filter((dimension) => !completedDimensions.includes(dimension));
  const contradictions = detectContradictions(answers);
  const activeDimension = [...requiredDimensions, ...optionalDimensions]
    .find((dimension) => !completedDimensions.includes(dimension) && !skippedDimensions.has(dimension));
  const activeQuestion = activeDimension
    ? {
      dimension: activeDimension,
      prompt: questions[activeDimension],
      required: requiredDimensions.includes(activeDimension),
    }
    : undefined;
  const completionState = contradictions.length > 0
    ? 'clarification_required'
    : missingDimensions.length === 0 && !activeQuestion
      ? 'complete'
      : completedDimensions.length > 0
        ? 'in_progress'
        : 'not_started';

  return Object.freeze({
    reflectionId: input.reflectionId,
    mode: input.mode,
    sourceRecordId: input.sourceRecordId,
    ...(input.linkedMissionId ? { linkedMissionId: input.linkedMissionId } : {}),
    knownContext: Object.freeze(knownContext),
    requiredDimensions: Object.freeze(requiredDimensions),
    optionalDimensions: Object.freeze(optionalDimensions),
    ...(activeQuestion ? { activeQuestion: Object.freeze(activeQuestion) } : {}),
    completedDimensions: Object.freeze(completedDimensions),
    missingDimensions: Object.freeze(missingDimensions),
    contradictions: Object.freeze(contradictions),
    completionState,
    nextAction: contradictions.length > 0
      ? 'clarify_contradiction'
      : missingDimensions.length === 0 && !activeQuestion
        ? 'complete_reflection'
        : 'answer_active_question',
  });
}

export function answerJournalReflectionQuestion(
  plan: JournalReflectionPlan,
  answer: JournalReflectionAnswer,
): JournalReflectionPlan {
  return buildJournalReflectionPlan({
    reflectionId: plan.reflectionId,
    mode: plan.mode,
    sourceRecordId: plan.sourceRecordId,
    linkedMissionId: plan.linkedMissionId,
    knownContext: plan.knownContext,
    answers: [
      ...plan.completedDimensions
        .filter((dimension) => !plan.knownContext.some((context) => context.dimension === dimension))
        .map((dimension) => ({ dimension, answer: 'restored answer' })),
      answer,
    ],
  });
}

function detectContradictions(answers: readonly JournalReflectionAnswer[]): readonly string[] {
  const byDimension = new Map<JournalReflectionDimension, string>();
  const contradictions: string[] = [];
  for (const answer of answers) {
    const normalized = answer.answer.trim().toLowerCase();
    if (!normalized || answer.skipped) continue;
    const existing = byDimension.get(answer.dimension);
    if (existing && existing !== normalized) {
      contradictions.push(`Conflicting answers for ${answer.dimension}.`);
    }
    byDimension.set(answer.dimension, normalized);
  }
  return contradictions;
}
