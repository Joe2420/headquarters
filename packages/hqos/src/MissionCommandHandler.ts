import type { Mission, UUID } from '@headquarters/shared';
import type { MissionCommand } from './MissionCommands';
import type { MissionCommandValidationError } from './MissionCommandValidation';

export type MissionCommandHandlerFailureCode =
  | 'command.validation_failed'
  | 'command.not_supported'
  | 'command.execution_unavailable'
  | 'mission.not_found'
  | 'mission.transition_invalid';

export interface ValidatedMissionCommand<TCommand extends MissionCommand = MissionCommand> {
  readonly command: TCommand;
  readonly validated: true;
}

export interface MissionCommandHandlerSuccess<TResult = unknown> {
  readonly ok: true;
  readonly commandId: UUID;
  readonly result: TResult;
}

export interface MissionCommandHandlerFailure {
  readonly ok: false;
  readonly commandId?: UUID;
  readonly code: MissionCommandHandlerFailureCode;
  readonly message: string;
  readonly validationErrors?: readonly MissionCommandValidationError[];
}

export type MissionCommandHandlerResult<TResult = unknown> =
  | MissionCommandHandlerSuccess<TResult>
  | MissionCommandHandlerFailure;

export interface MissionCommandExecutionContext {
  readonly now: () => string;
}

export interface MissionCommandHandler<TResult = unknown> {
  handle(
    command: ValidatedMissionCommand,
    context: MissionCommandExecutionContext,
  ): Promise<MissionCommandHandlerResult<TResult>> | MissionCommandHandlerResult<TResult>;
}

export interface MissionCommandHandlerDependencies {
  readonly loadMission?: (missionId: UUID) => Mission | undefined;
}
