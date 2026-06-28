import type { MissionCommand } from './MissionCommands';
import type {
  MissionCommandExecutionContext,
  MissionCommandHandler,
  MissionCommandHandlerFailure,
  MissionCommandHandlerResult,
  ValidatedMissionCommand,
} from './MissionCommandHandler';
import { isValidMissionCommand, validateMissionCommand } from './MissionCommandValidation';

export class MissionCommandDispatcher<TResult = unknown> {
  constructor(private readonly handler: MissionCommandHandler<TResult>) {}

  dispatch(
    command: unknown,
    context: MissionCommandExecutionContext,
  ): Promise<MissionCommandHandlerResult<TResult>> | MissionCommandHandlerResult<TResult> {
    const validation = validateMissionCommand(command);
    if (!validation.valid) {
      return createValidationFailure(command, validation.errors);
    }

    if (!isValidMissionCommand(command)) {
      return createValidationFailure(command, validation.errors);
    }

    return this.handler.handle(toValidatedMissionCommand(command), context);
  }
}

function createValidationFailure(
  command: unknown,
  validationErrors: MissionCommandHandlerFailure['validationErrors'],
): MissionCommandHandlerFailure {
  const commandId = getCommandId(command);

  return {
    ok: false,
    ...(commandId !== undefined ? { commandId } : {}),
    code: 'command.validation_failed',
    message: 'Mission command validation failed.',
    ...(validationErrors !== undefined ? { validationErrors } : {}),
  };
}

function toValidatedMissionCommand(command: MissionCommand): ValidatedMissionCommand {
  return {
    command,
    validated: true,
  };
}

function getCommandId(command: unknown): string | undefined {
  if (typeof command !== 'object' || command === null || Array.isArray(command)) {
    return undefined;
  }

  const commandId = (command as { commandId?: unknown }).commandId;
  return typeof commandId === 'string' && commandId.trim().length > 0 ? commandId : undefined;
}
