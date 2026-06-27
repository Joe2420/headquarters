import type { MissionState, UUID } from '@headquarters/shared';
import type {
  MissionStateDurationMs,
  MissionTimeline,
  MissionTimelineBuilder,
  MissionTimelineTransition,
} from './MissionTimelineBuilder';

export class MissionTimelineQuery {
  constructor(private readonly missionTimelineBuilder: MissionTimelineBuilder) {}

  getTimelineByMissionId(missionId: UUID): MissionTimeline {
    return this.missionTimelineBuilder.buildForMission(missionId);
  }

  getLatestMissionState(missionId: UUID): MissionState | undefined {
    return this.getLatestTimelineEntry(missionId)?.transition.to;
  }

  getLatestTransition(missionId: UUID): MissionTimelineTransition | undefined {
    return this.getLatestTimelineEntry(missionId)?.transition;
  }

  getMissionLifetimeMs(missionId: UUID): number {
    return this.getTimelineByMissionId(missionId).durations.lifetimeMs;
  }

  getDurationForStateMs(missionId: UUID, state: MissionState): number {
    return this.getTimelineByMissionId(missionId).durations.byStateMs[state];
  }

  getDurationsByStateMs(missionId: UUID): MissionStateDurationMs {
    return { ...this.getTimelineByMissionId(missionId).durations.byStateMs };
  }

  private getLatestTimelineEntry(missionId: UUID): MissionTimeline['entries'][number] | undefined {
    return this.getTimelineByMissionId(missionId).entries.at(-1);
  }
}
