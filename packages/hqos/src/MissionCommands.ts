import type { ISODateTime, MissionState, UUID } from '@headquarters/shared';

export type MissionCommandType =
  | 'mission.create'
  | 'mission.authorization.request'
  | 'mission.start'
  | 'mission.state.change'
  | 'mission.complete'
  | 'mission.abort';

export interface MissionCommandBase {
  readonly type: MissionCommandType;
  readonly commandId: UUID;
  readonly requestedAt: ISODateTime;
  readonly correlationId?: UUID;
  readonly causationId?: UUID;
}

export interface CreateMissionCommand extends MissionCommandBase {
  readonly type: 'mission.create';
  readonly codename: string;
  readonly campaignId?: UUID;
  readonly objective?: string;
}

export interface RequestMissionAuthorizationCommand extends MissionCommandBase {
  readonly type: 'mission.authorization.request';
  readonly missionId: UUID;
  readonly reason?: string;
}

export interface StartMissionCommand extends MissionCommandBase {
  readonly type: 'mission.start';
  readonly missionId: UUID;
  readonly reason?: string;
}

export interface ChangeMissionStateCommand extends MissionCommandBase {
  readonly type: 'mission.state.change';
  readonly missionId: UUID;
  readonly targetState: MissionState;
  readonly reason?: string;
}

export interface CompleteMissionCommand extends MissionCommandBase {
  readonly type: 'mission.complete';
  readonly missionId: UUID;
  readonly outcome?: string;
}

export interface AbortMissionCommand extends MissionCommandBase {
  readonly type: 'mission.abort';
  readonly missionId: UUID;
  readonly reason: string;
}

export type MissionCommand =
  | CreateMissionCommand
  | RequestMissionAuthorizationCommand
  | StartMissionCommand
  | ChangeMissionStateCommand
  | CompleteMissionCommand
  | AbortMissionCommand;
