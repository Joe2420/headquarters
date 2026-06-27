import type { UUID } from '@headquarters/shared';
import type { MissionCommand } from './MissionCommands';
import type {
  MissionCommandHandlerFailure,
  MissionCommandHandlerResult,
  MissionCommandHandlerSuccess,
} from './MissionCommandHandler';

export type MissionCommandResultEventTypeCandidate =
  | 'mission.command.succeeded'
  | 'mission.command.failed';

export interface MissionCommandSucceededPayloadCandidate<TResult = unknown> {
  readonly commandId: UUID;
  readonly commandType: MissionCommand['type'];
  readonly ok: true;
  readonly result: TResult;
}

export interface MissionCommandFailedPayloadCandidate {
  readonly commandId?: UUID;
  readonly commandType: MissionCommand['type'];
  readonly ok: false;
  readonly code: MissionCommandHandlerFailure['code'];
  readonly message: string;
  readonly validationErrors?: MissionCommandHandlerFailure['validationErrors'];
}

export type MissionCommandResultPayloadCandidate<TResult = unknown> =
  | MissionCommandSucceededPayloadCandidate<TResult>
  | MissionCommandFailedPayloadCandidate;

export interface MissionCommandResultEventCandidate<TResult = unknown> {
  readonly type: MissionCommandResultEventTypeCandidate;
  readonly payload: MissionCommandResultPayloadCandidate<TResult>;
}

export function mapMissionCommandResultToEventCandidate<TResult>(
  command: MissionCommand,
  result: MissionCommandHandlerResult<TResult>,
): MissionCommandResultEventCandidate<TResult> {
  return result.ok
    ? mapSuccessResult(command, result)
    : mapFailureResult(command, result);
}

function mapSuccessResult<TResult>(
  command: MissionCommand,
  result: MissionCommandHandlerSuccess<TResult>,
): MissionCommandResultEventCandidate<TResult> {
  return {
    type: 'mission.command.succeeded',
    payload: {
      commandId: result.commandId,
      commandType: command.type,
      ok: true,
      result: result.result,
    },
  };
}

function mapFailureResult(
  command: MissionCommand,
  result: MissionCommandHandlerFailure,
): MissionCommandResultEventCandidate<never> {
  return {
    type: 'mission.command.failed',
    payload: {
      ...(result.commandId !== undefined ? { commandId: result.commandId } : {}),
      commandType: command.type,
      ok: false,
      code: result.code,
      message: result.message,
      ...(result.validationErrors !== undefined ? { validationErrors: result.validationErrors } : {}),
    },
  };
}
