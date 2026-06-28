import type { UUID } from '@headquarters/shared';
import type { MissionCommand } from './MissionCommands';
import type {
  MissionCommandResultEventCandidate,
  MissionCommandResultEventTypeCandidate,
} from './MissionCommandResultEvents';

export interface MissionCommandPersistenceRequest<TResult = unknown> {
  readonly commandId?: UUID;
  readonly commandType: MissionCommand['type'];
  readonly eventCandidate: MissionCommandResultEventCandidate<TResult>;
}

export interface MissionCommandPersistenceSuccess {
  readonly ok: true;
  readonly commandId?: UUID;
  readonly eventType: MissionCommandResultEventTypeCandidate;
}

export type MissionCommandPersistenceFailureCode =
  | 'mission_command_persistence_unavailable'
  | 'mission_command_persistence_rejected';

export interface MissionCommandPersistenceFailure {
  readonly ok: false;
  readonly commandId?: UUID;
  readonly code: MissionCommandPersistenceFailureCode;
  readonly message: string;
}

export type MissionCommandPersistenceResult =
  | MissionCommandPersistenceSuccess
  | MissionCommandPersistenceFailure;

export interface MissionCommandPersistencePort<TResult = unknown> {
  appendCommandResultEventCandidate(
    request: MissionCommandPersistenceRequest<TResult>,
  ): Promise<MissionCommandPersistenceResult> | MissionCommandPersistenceResult;
}
