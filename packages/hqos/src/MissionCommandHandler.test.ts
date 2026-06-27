import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Mission } from '@headquarters/shared';
import type { StartMissionCommand } from './MissionCommands';
import type {
  MissionCommandExecutionContext,
  MissionCommandHandler,
  MissionCommandHandlerDependencies,
  MissionCommandHandlerFailure,
  MissionCommandHandlerResult,
  MissionCommandHandlerSuccess,
  ValidatedMissionCommand,
} from './MissionCommandHandler';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-27T12:00:00.000Z';

const startCommand: StartMissionCommand = {
  type: 'mission.start',
  commandId,
  requestedAt,
  missionId,
};

describe('MissionCommandHandler', () => {
  it('accepts validated mission commands through the handler interface', () => {
    const validatedCommand: ValidatedMissionCommand<StartMissionCommand> = {
      command: startCommand,
      validated: true,
    };
    const context: MissionCommandExecutionContext = {
      now: () => requestedAt,
    };
    const handler: MissionCommandHandler<{ accepted: true }> = {
      handle(command) {
        return {
          ok: true,
          commandId: command.command.commandId,
          result: { accepted: true },
        };
      },
    };

    expect(handler.handle(validatedCommand, context)).toEqual({
      ok: true,
      commandId,
      result: { accepted: true },
    });
  });

  it('defines deterministic success and failure result contracts', () => {
    const success: MissionCommandHandlerSuccess<{ missionId: string }> = {
      ok: true,
      commandId,
      result: { missionId },
    };
    const failure: MissionCommandHandlerFailure = {
      ok: false,
      commandId,
      code: 'command.validation_failed',
      message: 'Command validation failed.',
      validationErrors: [
        {
          path: 'missionId',
          code: 'field.required',
          message: 'missionId is required.',
        },
      ],
    };

    expect(success.ok).toBe(true);
    expect(failure).toMatchObject({
      ok: false,
      code: 'command.validation_failed',
    });
  });

  it('keeps handler result and dependency contracts type-focused', () => {
    expectTypeOf<MissionCommandHandlerResult<{ missionId: string }>>().toEqualTypeOf<
      MissionCommandHandlerSuccess<{ missionId: string }> | MissionCommandHandlerFailure
    >();
    expectTypeOf<MissionCommandHandlerDependencies['loadMission']>().toEqualTypeOf<
      ((missionId: string) => Mission | undefined) | undefined
    >();
  });
});
