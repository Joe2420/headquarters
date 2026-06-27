import type { MissionState, UUID } from '@headquarters/shared';
import type { MissionStateDurationMs, MissionTimelineTransition } from './MissionTimelineBuilder';
import type { MissionTimelineQuery } from './MissionTimelineQuery';

export interface MissionTimelineSnapshot {
  readonly missionId: UUID;
  readonly currentState?: MissionState;
  readonly missionLifetimeMs: number;
  readonly stateDurationsMs: Readonly<MissionStateDurationMs>;
  readonly latestTransition?: MissionTimelineTransition;
}

export class MissionTimelineSnapshotBuilder {
  constructor(private readonly missionTimelineQuery: MissionTimelineQuery) {}

  buildForMission(missionId: UUID): Readonly<MissionTimelineSnapshot> {
    const latestTransition = this.missionTimelineQuery.getLatestTransition(missionId);
    const immutableLatestTransition =
      latestTransition !== undefined
        ? Object.freeze({
            from: latestTransition.from,
            to: latestTransition.to,
          })
        : undefined;
    const snapshot: MissionTimelineSnapshot = {
      missionId,
      ...(immutableLatestTransition !== undefined ? { latestTransition: immutableLatestTransition } : {}),
      ...(immutableLatestTransition !== undefined ? { currentState: immutableLatestTransition.to } : {}),
      missionLifetimeMs: this.missionTimelineQuery.getMissionLifetimeMs(missionId),
      stateDurationsMs: Object.freeze(this.missionTimelineQuery.getDurationsByStateMs(missionId)),
    };

    return Object.freeze(snapshot);
  }
}
