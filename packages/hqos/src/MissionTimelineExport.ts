import type { MissionState, UUID } from '@headquarters/shared';
import type { MissionTimeline } from './MissionTimelineBuilder';

export const MISSION_TIMELINE_DURATION_MODEL = 'state_entry_until_next_state_change' as const;
export const MISSION_TIMELINE_FINAL_STATE_DURATION_MS = 0;

export interface MissionTimelineExportTransitionDTO {
  from: MissionState;
  to: MissionState;
}

export interface MissionTimelineExportEntryDTO {
  eventId: UUID;
  missionId: UUID;
  occurredAt: string;
  transition: MissionTimelineExportTransitionDTO;
  reason?: string;
}

export interface MissionTimelineExportDurationsDTO {
  byStateMs: Record<MissionState, number>;
  lifetimeMs: number;
  durationModel: typeof MISSION_TIMELINE_DURATION_MODEL;
  finalStateDurationMs: typeof MISSION_TIMELINE_FINAL_STATE_DURATION_MS;
}

export interface MissionTimelineExportDTO {
  missionId?: UUID;
  entries: MissionTimelineExportEntryDTO[];
  transitions: MissionTimelineExportTransitionDTO[];
  durations: MissionTimelineExportDurationsDTO;
}

export function serializeMissionTimeline(timeline: MissionTimeline): MissionTimelineExportDTO {
  return {
    ...(timeline.missionId !== undefined ? { missionId: timeline.missionId } : {}),
    entries: timeline.entries.map((entry) => ({
      eventId: entry.eventId,
      missionId: entry.missionId,
      occurredAt: entry.occurredAt,
      transition: {
        from: entry.transition.from,
        to: entry.transition.to,
      },
      ...(entry.reason !== undefined ? { reason: entry.reason } : {}),
    })),
    transitions: timeline.transitions.map((transition) => ({
      from: transition.from,
      to: transition.to,
    })),
    durations: {
      byStateMs: { ...timeline.durations.byStateMs },
      lifetimeMs: timeline.durations.lifetimeMs,
      durationModel: MISSION_TIMELINE_DURATION_MODEL,
      finalStateDurationMs: MISSION_TIMELINE_FINAL_STATE_DURATION_MS,
    },
  };
}
