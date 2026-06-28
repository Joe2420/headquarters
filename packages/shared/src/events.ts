import type { Department, ISODateTime, MissionState, UUID } from './domain';

export type EventPriority = 'white' | 'green' | 'amber' | 'red' | 'black';

export type HeadquartersEventType =
  | 'system.boot.started'
  | 'system.boot.completed'
  | 'hq.boot.started'
  | 'hq.boot.completed'
  | 'hq.shutdown.requested'
  | 'mission.created'
  | 'mission.briefing_started'
  | 'mission.briefing_completed'
  | 'mission.observation_started'
  | 'mission.authorization_requested'
  | 'mission.authorized'
  | 'mission.authorization_denied'
  | 'mission.deployment_declared'
  | 'mission.objective_achieved'
  | 'mission.return_to_base_requested'
  | 'mission.completed'
  | 'mission.debrief_started'
  | 'mission.debrief_completed'
  | 'mission.archived'
  | 'mission.state.changed'
  | 'mission.command.succeeded'
  | 'mission.command.failed'
  | 'operator.command_assumed'
  | 'operator.command_released'
  | 'operator.identity_snapshot_recorded'
  | 'operator.identity_drift_detected'
  | 'operator.judgment_reserve_changed'
  | 'operator.readiness_report_submitted'
  | 'operator.recovery_window_started'
  | 'operator.recovery_window_completed'
  | 'guardian.protocol_activated'
  | 'guardian.intervention_recommended'
  | 'guardian.vault_secured'
  | 'guardian.unlock_requested'
  | 'guardian.success_protocol_activated'
  | 'guardian.capital_integrity_changed'
  | 'archive.artifact_written'
  | 'archive.campaign_book_updated'
  | 'archive.doctrine_snapshot_saved'
  | 'archive.black_box_closed'
  | 'environment.room_entered'
  | 'environment.lighting_profile_changed'
  | 'environment.audio_profile_changed'
  | 'environment.transition_started'
  | 'environment.transition_completed';

export interface EventEnvelope<TPayload = unknown> {
  id: UUID;
  type: HeadquartersEventType;
  version: number;
  occurredAt: ISODateTime;
  source: Department | string;
  missionId?: UUID;
  campaignId?: UUID;
  correlationId?: UUID;
  causationId?: UUID;
  priority: EventPriority;
  payload: TPayload;
}

export type HQEvent<TPayload = unknown> = EventEnvelope<TPayload>;

export interface HeadquartersEvent<TPayload = unknown> {
  id: UUID;
  type: HeadquartersEventType;
  timestamp: ISODateTime;
  source: Department | string;
  payload: TPayload;
  correlationId?: UUID;
}

export interface MissionStateChangedPayload {
  missionId: UUID;
  from: MissionState;
  to: MissionState;
  reason?: string;
}
