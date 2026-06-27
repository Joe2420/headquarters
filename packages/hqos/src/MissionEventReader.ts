import type { ArchiveRepository } from '@headquarters/database';
import type { HQEvent, MissionStateChangedPayload, UUID } from '@headquarters/shared';

export type MissionStateChangedEvent = HQEvent<MissionStateChangedPayload>;

export class MissionEventReader {
  constructor(private readonly archiveRepository: ArchiveRepository) {}

  listStateChanges(): MissionStateChangedEvent[] {
    return this.archiveRepository.list().filter(isMissionStateChangedEvent);
  }

  listStateChangesForMission(missionId: UUID): MissionStateChangedEvent[] {
    return this.listStateChanges().filter((event) => event.payload.missionId === missionId);
  }
}

function isMissionStateChangedEvent(event: HQEvent): event is MissionStateChangedEvent {
  return event.type === 'mission.state.changed' && isMissionStateChangedPayload(event.payload);
}

function isMissionStateChangedPayload(payload: unknown): payload is MissionStateChangedPayload {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return false;
  }

  return (
    'missionId' in payload &&
    'from' in payload &&
    'to' in payload &&
    typeof payload.missionId === 'string' &&
    typeof payload.from === 'string' &&
    typeof payload.to === 'string'
  );
}
