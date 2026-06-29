import type { HeadquartersEventType, HQEvent, ISODateTime, Mission, UUID } from '@headquarters/shared';

export interface MissionArchiveSummary {
  readonly missionId: UUID;
  readonly codename: string;
  readonly archivedAt: ISODateTime;
  readonly eventCount: number;
  readonly eventTypes: readonly HeadquartersEventType[];
}

export class MissionArchiveSummaryStateError extends Error {
  constructor(
    readonly missionId: UUID,
    readonly state: Mission['state'],
  ) {
    super(`Mission ${missionId} cannot be summarized as archived from state ${state}.`);
    this.name = 'MissionArchiveSummaryStateError';
  }
}

export function buildMissionArchiveSummary(
  mission: Mission,
  events: readonly HQEvent[],
): MissionArchiveSummary {
  if (mission.state !== 'archived') {
    throw new MissionArchiveSummaryStateError(mission.id, mission.state);
  }

  const missionEvents = events.filter((event) => event.missionId === mission.id);

  return {
    missionId: mission.id,
    codename: mission.codename,
    archivedAt: mission.updatedAt,
    eventCount: missionEvents.length,
    eventTypes: missionEvents.map((event) => event.type),
  };
}
