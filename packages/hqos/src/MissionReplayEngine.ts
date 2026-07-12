import type { MissionLifecycleProjection } from './MissionLifecycleProjection';
import type { MissionEvaluation } from './MissionEvaluationEngine';
import type { OperationalConsequence } from './OperationalConsequence';
import type { LivingHeadquartersHistoryEvent } from './LivingHeadquartersHistory';
import {
  createMissionReplay,
  createReplayEvent,
  type MissionReplay,
  type ReplayEvent,
  type ReplayEventType,
  type ReplaySection,
} from './MissionReplay';

export interface MissionReplayEvidenceRecord {
  readonly id: string;
  readonly source: string;
  readonly occurredAt: string;
  readonly title: string;
  readonly summary: string;
  readonly section: ReplaySection;
  readonly type: ReplayEventType;
  readonly actor: ReplayEvent['actor'];
  readonly room?: string | undefined;
}

export interface MissionReplayEngineInput {
  readonly missionId: string;
  readonly missionName: string;
  readonly createdAt: string;
  readonly lifecycle: MissionLifecycleProjection;
  readonly evaluation?: MissionEvaluation | undefined;
  readonly consequences?: readonly OperationalConsequence[] | undefined;
  readonly livingHistory?: readonly LivingHeadquartersHistoryEvent[] | undefined;
  readonly evidenceRecords?: readonly MissionReplayEvidenceRecord[] | undefined;
}

export function buildMissionReplay(input: MissionReplayEngineInput): MissionReplay {
  const events = [
    buildMissionOpeningEvent(input),
    ...buildLifecycleEvents(input),
    ...buildEvidenceRecordEvents(input.evidenceRecords ?? []),
    ...buildLivingHistoryEvents(input.livingHistory ?? []),
    ...buildConsequenceEvents(input.consequences ?? []),
    ...(input.evaluation ? [buildEvaluationEvent(input.evaluation)] : []),
  ];

  const replay = createMissionReplay({
    replayId: `replay:${input.missionId}`,
    missionId: input.missionId,
    missionName: input.missionName,
    createdAt: input.createdAt,
    events,
    evaluation: input.evaluation,
    bookmarks: events
      .filter((event) => event.decision !== undefined || event.type === 'evaluation')
      .map((event) => ({
        id: `bookmark:${event.id}`,
        eventId: event.id,
        label: event.title,
        reason: event.decision?.reasoning ?? event.summary,
      })),
    recommendations: (input.evaluation?.recommendations ?? []).map((recommendation, index) => ({
      id: `recommendation:${input.missionId}:${index}`,
      text: recommendation,
      evidenceIds: [input.evaluation!.id],
    })),
    commanderSummary: buildReplayCommanderSummary(input),
  });

  return replay;
}

function buildMissionOpeningEvent(input: MissionReplayEngineInput): ReplayEvent {
  return createReplayEvent({
    id: `replay-event:${input.missionId}:mission-opening`,
    type: 'room_entered',
    section: 'mission-opening',
    occurredAt: input.createdAt,
    title: 'Mission opened',
    summary: `${input.missionName} entered Headquarters replay.`,
    actor: 'commander',
    room: input.lifecycle.recommendedRoom,
    evidence: [{
      id: input.missionId,
      source: 'mission',
      description: 'Mission identity and lifecycle projection.',
    }],
    narration: {
      id: `narration:${input.missionId}:mission-opening`,
      text: 'Commander reconstructs the mission from persisted Headquarters evidence.',
      evidenceIds: [input.missionId],
    },
  });
}

function buildLifecycleEvents(input: MissionReplayEngineInput): readonly ReplayEvent[] {
  return [
    ...input.lifecycle.completedStages.map((stage, index) => createReplayEvent({
      id: `replay-event:${input.missionId}:lifecycle:${stage}`,
      type: 'transition',
      section: mapLifecycleStageToReplaySection(stage),
      occurredAt: addSeconds(input.createdAt, index + 1),
      title: `${formatStage(stage)} completed`,
      summary: `Lifecycle stage ${formatStage(stage)} is recorded as complete.`,
      actor: 'commander',
      room: input.lifecycle.recommendedRoom,
      evidence: [{
        id: `${input.missionId}:${stage}`,
        source: 'mission',
        description: `Lifecycle stage ${formatStage(stage)} completed.`,
      }],
    })),
    createReplayEvent({
      id: `replay-event:${input.missionId}:active-stage:${input.lifecycle.activeStage}`,
      type: 'room_entered',
      section: mapLifecycleStageToReplaySection(input.lifecycle.activeStage),
      occurredAt: addSeconds(input.createdAt, input.lifecycle.completedStages.length + 1),
      title: `${formatStage(input.lifecycle.activeStage)} active`,
      summary: input.lifecycle.transitionReason,
      actor: 'commander',
      room: input.lifecycle.recommendedRoom,
      evidence: [{
        id: `${input.missionId}:active-stage`,
        source: 'mission',
        description: input.lifecycle.transitionReason,
      }],
    }),
  ];
}

function buildEvidenceRecordEvents(records: readonly MissionReplayEvidenceRecord[]): readonly ReplayEvent[] {
  return records.map((record) => createReplayEvent({
    id: `replay-event:evidence:${record.id}`,
    type: record.type,
    section: record.section,
    occurredAt: record.occurredAt,
    title: record.title,
    summary: record.summary,
    actor: record.actor,
    room: record.room,
    evidence: [{
      id: record.id,
      source: record.source,
      description: record.summary,
    }],
  }));
}

function buildLivingHistoryEvents(events: readonly LivingHeadquartersHistoryEvent[]): readonly ReplayEvent[] {
  return events.map((event) => createReplayEvent({
    id: `replay-event:living:${event.eventId}`,
    type: event.eventType === 'interruption_started' ? 'attention_request' : 'commander_response',
    section: event.eventType === 'interruption_started' ? 'interruptions' : 'recovery',
    occurredAt: event.occurredAt,
    title: event.action ?? event.eventType,
    summary: event.explanation,
    actor: 'commander',
    room: event.room,
    evidence: event.evidenceReferences.map((id) => ({
      id,
      source: 'living-headquarters',
      description: event.explanation,
    })),
  }));
}

function buildConsequenceEvents(consequences: readonly OperationalConsequence[]): readonly ReplayEvent[] {
  return consequences.map((consequence) => createReplayEvent({
    id: `replay-event:consequence:${consequence.consequenceId}`,
    type: 'attention_request',
    section: 'recovery',
    occurredAt: consequence.createdAt,
    title: consequence.title,
    summary: consequence.explanation,
    actor: consequence.category === 'guardian' ? 'guardian' : 'commander',
    evidence: consequence.evidenceReferences.map((reference) => ({
      id: reference.id,
      source: reference.source,
      description: reference.description ?? consequence.explanation,
    })),
  }));
}

function buildEvaluationEvent(evaluation: MissionEvaluation): ReplayEvent {
  return createReplayEvent({
    id: `replay-event:evaluation:${evaluation.id}`,
    type: 'evaluation',
    section: 'evaluation',
    occurredAt: evaluation.evaluatedAt,
    title: evaluation.verdict,
    summary: evaluation.commanderReview,
    actor: 'evaluation',
    evidence: [{
      id: evaluation.id,
      source: 'evaluation',
      description: evaluation.commanderReview,
    }],
    narration: {
      id: `narration:${evaluation.id}`,
      text: evaluation.commanderVerdict,
      evidenceIds: [evaluation.id],
    },
  });
}

function buildReplayCommanderSummary(input: MissionReplayEngineInput): string {
  if (input.evaluation) {
    return `Commander reconstructs ${input.missionName}. Final evaluation: ${input.evaluation.verdict}.`;
  }
  return `Commander reconstructs ${input.missionName} from available persisted evidence.`;
}

function mapLifecycleStageToReplaySection(stage: MissionLifecycleProjection['activeStage']): ReplaySection {
  if (stage === 'missionCreation') return 'mission-opening';
  if (stage === 'briefing') return 'ready-room';
  if (stage === 'observation') return 'observation';
  if (stage === 'authorization') return 'war-room';
  if (stage === 'deployed') return 'deployment';
  if (stage === 'returnToBase' || stage === 'debrief') return 'debrief';
  return 'archive';
}

function formatStage(stage: MissionLifecycleProjection['activeStage']): string {
  return stage.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function addSeconds(value: string, seconds: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${value}:${seconds.toString().padStart(2, '0')}`;
  date.setUTCSeconds(date.getUTCSeconds() + seconds);
  return date.toISOString();
}
