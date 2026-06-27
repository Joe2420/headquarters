import type { MissionState, UUID } from '@headquarters/shared';
import type { MissionStateChangedEvent } from './MissionEventReader';

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

export interface MissionTimeline {
  missionId?: UUID;
  entries: MissionTimelineEntry[];
  transitions: MissionTimelineTransition[];
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
