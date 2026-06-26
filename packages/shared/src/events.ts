import type { ISODateTime, UUID } from './domain';

export type HeadquartersEventType =
  | 'hq.boot.started'
  | 'hq.boot.completed'
  | 'hq.shutdown.requested'
  | 'mission.created'
  | 'mission.state.changed'
  | 'mission.authorization.requested'
  | 'mission.authorization.granted'
  | 'mission.authorization.denied'
  | 'guardian.intervention.recommended'
  | 'operator.snapshot.captured'
  | 'archive.mission.persisted';

export interface HeadquartersEvent<TPayload = unknown> {
  id: UUID;
  type: HeadquartersEventType;
  timestamp: ISODateTime;
  source: string;
  payload: TPayload;
  correlationId?: UUID;
}

export interface MissionStateChangedPayload {
  missionId: UUID;
  from: string;
  to: string;
  reason?: string;
}
