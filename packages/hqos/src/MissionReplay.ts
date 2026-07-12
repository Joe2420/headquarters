import type { MissionEvaluation } from './MissionEvaluationEngine';

export type ReplaySection =
  | 'mission-opening'
  | 'ready-room'
  | 'observation'
  | 'war-room'
  | 'deployment'
  | 'debrief'
  | 'evaluation'
  | 'archive'
  | 'recovery'
  | 'interruptions';

export type ReplayEventType =
  | 'room_entered'
  | 'question_asked'
  | 'operator_answer'
  | 'commander_response'
  | 'transition'
  | 'guardian_event'
  | 'attention_request'
  | 'doctrine_review'
  | 'journal_update'
  | 'academy_milestone'
  | 'evaluation'
  | 'archive';

export type ReplayEvidenceSource =
  | 'mission'
  | 'commander'
  | 'guardian'
  | 'doctrine'
  | 'journal'
  | 'academy'
  | 'evaluation'
  | 'archive'
  | 'living-headquarters'
  | 'operational-consequence'
  | string;

export interface ReplayEvidence {
  readonly id: string;
  readonly source: ReplayEvidenceSource;
  readonly description: string;
}

export interface ReplayNarration {
  readonly id: string;
  readonly text: string;
  readonly evidenceIds: readonly string[];
}

export interface ReplayRecommendation {
  readonly id: string;
  readonly text: string;
  readonly evidenceIds: readonly string[];
}

export interface ReplayDecision {
  readonly id: string;
  readonly title: string;
  readonly reasoning: string;
  readonly evidenceIds: readonly string[];
  readonly commanderReview: string;
}

export interface ReplayEvent {
  readonly id: string;
  readonly type: ReplayEventType;
  readonly section: ReplaySection;
  readonly occurredAt: string;
  readonly title: string;
  readonly summary: string;
  readonly room?: string | undefined;
  readonly actor: 'commander' | 'operator' | 'guardian' | 'doctrine' | 'journal' | 'academy' | 'evaluation' | 'archive';
  readonly evidence: readonly ReplayEvidence[];
  readonly narration?: ReplayNarration | undefined;
  readonly decision?: ReplayDecision | undefined;
}

export interface ReplayBookmark {
  readonly id: string;
  readonly eventId: string;
  readonly label: string;
  readonly reason: string;
}

export interface ReplayTimeline {
  readonly events: readonly ReplayEvent[];
  readonly bookmarks: readonly ReplayBookmark[];
}

export interface ReplaySummary {
  readonly title: string;
  readonly commanderSummary: string;
  readonly finalOutcome: string;
  readonly eventCount: number;
  readonly evidenceCount: number;
  readonly recommendations: readonly ReplayRecommendation[];
}

export interface MissionReplay {
  readonly replayId: string;
  readonly missionId: string;
  readonly missionName: string;
  readonly createdAt: string;
  readonly lifecycle: readonly ReplaySection[];
  readonly commanderNarrative: readonly ReplayNarration[];
  readonly timeline: ReplayTimeline;
  readonly evaluation?: MissionEvaluation | undefined;
  readonly summary: ReplaySummary;
}

export interface MissionReplayInput {
  readonly replayId: string;
  readonly missionId: string;
  readonly missionName: string;
  readonly createdAt: string;
  readonly events: readonly ReplayEvent[];
  readonly bookmarks?: readonly ReplayBookmark[] | undefined;
  readonly evaluation?: MissionEvaluation | undefined;
  readonly recommendations?: readonly ReplayRecommendation[] | undefined;
  readonly commanderSummary?: string | undefined;
}

export function createReplayEvidence(input: ReplayEvidence): ReplayEvidence {
  if (!input.id.trim()) throw new Error('Replay evidence requires a stable id.');
  if (!input.description.trim()) throw new Error(`Replay evidence ${input.id} requires a description.`);
  return Object.freeze({ ...input });
}

export function createReplayNarration(input: ReplayNarration): ReplayNarration {
  if (!input.id.trim()) throw new Error('Replay narration requires a stable id.');
  if (!input.text.trim()) throw new Error(`Replay narration ${input.id} requires text.`);
  return Object.freeze({
    ...input,
    evidenceIds: Object.freeze([...input.evidenceIds]),
  });
}

export function createReplayEvent(input: ReplayEvent): ReplayEvent {
  if (!input.id.trim()) throw new Error('Replay event requires a stable id.');
  if (!input.title.trim()) throw new Error(`Replay event ${input.id} requires a title.`);
  if (!input.summary.trim()) throw new Error(`Replay event ${input.id} requires a summary.`);

  return Object.freeze({
    ...input,
    evidence: Object.freeze(input.evidence.map(createReplayEvidence)),
    ...(input.narration ? { narration: createReplayNarration(input.narration) } : {}),
    ...(input.decision ? { decision: freezeDecision(input.decision) } : {}),
  });
}

export function createMissionReplay(input: MissionReplayInput): MissionReplay {
  if (!input.replayId.trim()) throw new Error('Mission replay requires a stable replayId.');
  if (!input.missionId.trim()) throw new Error('Mission replay requires a missionId.');
  if (!input.missionName.trim()) throw new Error('Mission replay requires a mission name.');

  const events = Object.freeze([...input.events].map(createReplayEvent).sort(compareReplayEvents));
  const commanderNarrative = Object.freeze(events
    .map((event) => event.narration)
    .filter((narration): narration is ReplayNarration => narration !== undefined)
    .map(createReplayNarration));
  const recommendations = Object.freeze((input.recommendations ?? []).map(freezeRecommendation));
  const evidenceCount = new Set(events.flatMap((event) => event.evidence.map((evidence) => `${evidence.source}:${evidence.id}`))).size;

  return Object.freeze({
    replayId: input.replayId,
    missionId: input.missionId,
    missionName: input.missionName,
    createdAt: input.createdAt,
    lifecycle: Object.freeze([...new Set(events.map((event) => event.section))]),
    commanderNarrative,
    timeline: Object.freeze({
      events,
      bookmarks: Object.freeze((input.bookmarks ?? []).map(freezeBookmark)),
    }),
    ...(input.evaluation ? { evaluation: input.evaluation } : {}),
    summary: Object.freeze({
      title: `Replay: ${input.missionName}`,
      commanderSummary: input.commanderSummary ?? getDefaultCommanderSummary(events),
      finalOutcome: input.evaluation?.verdict ?? 'Pending evaluation',
      eventCount: events.length,
      evidenceCount,
      recommendations,
    }),
  });
}

export function compareReplayEvents(left: ReplayEvent, right: ReplayEvent): number {
  return left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id);
}

function freezeDecision(decision: ReplayDecision): ReplayDecision {
  return Object.freeze({
    ...decision,
    evidenceIds: Object.freeze([...decision.evidenceIds]),
  });
}

function freezeRecommendation(recommendation: ReplayRecommendation): ReplayRecommendation {
  return Object.freeze({
    ...recommendation,
    evidenceIds: Object.freeze([...recommendation.evidenceIds]),
  });
}

function freezeBookmark(bookmark: ReplayBookmark): ReplayBookmark {
  return Object.freeze({ ...bookmark });
}

function getDefaultCommanderSummary(events: readonly ReplayEvent[]): string {
  if (events.length === 0) return 'Commander has no persisted evidence to replay.';
  return `Commander reconstructed ${events.length} persisted mission event${events.length === 1 ? '' : 's'}.`;
}
