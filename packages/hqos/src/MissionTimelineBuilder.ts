import type { MissionState, UUID } from '@headquarters/shared';
import type { MissionStateChangedEvent } from './MissionEventReader';

const MISSION_STATES = [
  'idle',
  'briefing',
  'ready',
  'observation',
  'authorization',
  'deployed',
  'return_to_base',
  'debrief',
  'archived',
] as const satisfies readonly MissionState[];

export interface MissionStateChangeReader {
  listStateChanges(): MissionStateChangedEvent[];
  listStateChangesForMission(missionId: UUID): MissionStateChangedEvent[];
}

export interface MissionTimelineTransition {
  from: MissionState;
  to: MissionState;
}

export interface MissionTimelineEntry {
  eventId: UUID;
  missionId: UUID;
  occurredAt: string;
  transition: MissionTimelineTransition;
  reason?: string;
}

export type MissionStateDurationMs = Record<MissionState, number>;

export interface MissionTimelineDurations {
  byStateMs: MissionStateDurationMs;
  lifetimeMs: number;
}

export interface MissionTimeline {
  missionId?: UUID;
  entries: MissionTimelineEntry[];
  transitions: MissionTimelineTransition[];
  durations: MissionTimelineDurations;
}

export class MissionTimelineBuilder {
  constructor(private readonly missionEventReader: MissionStateChangeReader) {}

  buildAll(): MissionTimeline {
    return buildTimeline(this.missionEventReader.listStateChanges());
  }

  buildForMission(missionId: UUID): MissionTimeline {
    return buildTimeline(this.missionEventReader.listStateChangesForMission(missionId), missionId);
  }
}

function buildTimeline(events: MissionStateChangedEvent[], missionId?: UUID): MissionTimeline {
  const entries = events.map(toTimelineEntry);

  return {
    ...(missionId !== undefined ? { missionId } : {}),
    entries,
    transitions: entries.map((entry) => entry.transition),
    durations: calculateTimelineDurations(entries),
  };
}

function toTimelineEntry(event: MissionStateChangedEvent): MissionTimelineEntry {
  return {
    eventId: event.id,
    missionId: event.payload.missionId,
    occurredAt: event.occurredAt,
    transition: {
      from: event.payload.from,
      to: event.payload.to,
    },
    ...(event.payload.reason !== undefined ? { reason: event.payload.reason } : {}),
  };
}

function calculateTimelineDurations(entries: MissionTimelineEntry[]): MissionTimelineDurations {
  const byStateMs = createEmptyStateDurations();
  let previousEntry: MissionTimelineEntry | undefined;

  for (const entry of entries) {
    if (previousEntry !== undefined) {
      byStateMs[previousEntry.transition.to] += timestampMs(entry.occurredAt) - timestampMs(previousEntry.occurredAt);
    }

    previousEntry = entry;
  }

  return {
    byStateMs,
    lifetimeMs: calculateLifetimeMs(entries),
  };
}

function createEmptyStateDurations(): MissionStateDurationMs {
  return MISSION_STATES.reduce<MissionStateDurationMs>(
    (durations, state) => ({
      ...durations,
      [state]: 0,
    }),
    {} as MissionStateDurationMs,
  );
}

function calculateLifetimeMs(entries: MissionTimelineEntry[]): number {
  if (entries.length <= 1) {
    return 0;
  }

  const [firstEntry] = entries;
  const lastEntry = entries.at(-1);

  if (firstEntry === undefined || lastEntry === undefined) {
    return 0;
  }

  return timestampMs(lastEntry.occurredAt) - timestampMs(firstEntry.occurredAt);
}

function timestampMs(isoDateTime: string): number {
  return Date.parse(isoDateTime);
}
