import { describe, expect, it, vi } from 'vitest';
import type { StartMissionCommand } from './MissionCommands';
import type {
  MissionCommandExecutionContext,
  MissionCommandHandler,
  MissionCommandHandlerFailure,
  MissionCommandHandlerSuccess,
} from './MissionCommandHandler';
import { MissionCommandDispatcher } from './MissionCommandDispatcher';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-27T12:00:00.000Z';
const context: MissionCommandExecutionContext = {
  now: () => requestedAt,
};

function createValidCommand(): StartMissionCommand {
  return {
    type: 'mission.start',
    commandId,
    requestedAt,
    missionId,
  };
}

describe('MissionCommandDispatcher', () => {
  it('rejects invalid commands before handler execution', () => {
    const handler: MissionCommandHandler = {
      handle: vi.fn(),
    };
    const dispatcher = new MissionCommandDispatcher(handler);

    expect(
      dispatcher.dispatch(
        {
          type: 'mission.start',
          commandId,
          requestedAt,
        },
        context,
      ),
    ).toEqual({
      ok: false,
      commandId,
      code: 'command.validation_failed',
      message: 'Mission command validation failed.',
      validationErrors: [
        {
          path: 'missionId',
          code: 'field.required',
          message: 'missionId is required.',
        },
      ],
    });
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('routes valid commands to the provided handler exactly once', () => {
    const handler: MissionCommandHandler<{ accepted: true }> = {
      handle: vi.fn((validatedCommand): MissionCommandHandlerSuccess<{ accepted: true }> => {
        return {
          ok: true,
          commandId: validatedCommand.command.commandId,
          result: { accepted: true },
        };
      }),
    };
    const dispatcher = new MissionCommandDispatcher(handler);

    expect(dispatcher.dispatch(createValidCommand(), context)).toEqual({
      ok: true,
      commandId,
      result: { accepted: true },
    });
    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(handler.handle).toHaveBeenCalledWith(
      {
        command: createValidCommand(),
        validated: true,
      },
      context,
    );
  });

  it('returns deterministic handler failure results', () => {
    const handler: MissionCommandHandler = {
      handle: vi.fn((): MissionCommandHandlerFailure => {
        return {
          ok: false,
          commandId,
          code: 'command.not_supported',
          message: 'Command is not supported.',
        };
      }),
    };
    const dispatcher = new MissionCommandDispatcher(handler);

    expect(dispatcher.dispatch(createValidCommand(), context)).toEqual({
      ok: false,
      commandId,
      code: 'command.not_supported',
      message: 'Command is not supported.',
    });
  });

  it('supports async handler results without adding side effects', async () => {
    const handler: MissionCommandHandler<{ accepted: true }> = {
      handle: vi.fn(async (validatedCommand): Promise<MissionCommandHandlerSuccess<{ accepted: true }>> => {
        return {
          ok: true,
          commandId: validatedCommand.command.commandId,
          result: { accepted: true },
        };
      }),
    };
    const dispatcher = new MissionCommandDispatcher(handler);

    await expect(dispatcher.dispatch(createValidCommand(), context)).resolves.toEqual({
      ok: true,
      commandId,
      result: { accepted: true },
    });
    expect(handler.handle).toHaveBeenCalledTimes(1);
  });
});
