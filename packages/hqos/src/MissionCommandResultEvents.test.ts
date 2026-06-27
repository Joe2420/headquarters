import { describe, expect, it } from 'vitest';
import type { StartMissionCommand } from './MissionCommands';
import type { MissionCommandHandlerFailure, MissionCommandHandlerSuccess } from './MissionCommandHandler';
import { mapMissionCommandResultToEventCandidate } from './MissionCommandResultEvents';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const command: StartMissionCommand = {
  type: 'mission.start',
  commandId,
  requestedAt: '2026-06-27T12:00:00.000Z',
  missionId,
};

describe('MissionCommandResultEvents', () => {
  it('maps successful command results to typed event payload candidates', () => {
    const result: MissionCommandHandlerSuccess<{ missionId: string }> = {
      ok: true,
      commandId,
      result: { missionId },
    };

    expect(mapMissionCommandResultToEventCandidate(command, result)).toEqual({
      type: 'mission.command.succeeded',
      payload: {
        commandId,
        commandType: 'mission.start',
        ok: true,
        result: { missionId },
      },
    });
  });

  it('maps failed command results to typed event payload candidates', () => {
    const result: MissionCommandHandlerFailure = {
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
    };

    expect(mapMissionCommandResultToEventCandidate(command, result)).toEqual({
      type: 'mission.command.failed',
      payload: {
        commandId,
        commandType: 'mission.start',
        ok: false,
        code: 'command.validation_failed',
        message: 'Mission command validation failed.',
        validationErrors: [
          {
            path: 'missionId',
            code: 'field.required',
            message: 'missionId is required.',
          },
        ],
      },
    });
  });

  it('omits optional command id when a failure result has none', () => {
    const result: MissionCommandHandlerFailure = {
      ok: false,
      code: 'command.execution_unavailable',
      message: 'Command execution is unavailable.',
    };

    expect(mapMissionCommandResultToEventCandidate(command, result)).toEqual({
      type: 'mission.command.failed',
      payload: {
        commandType: 'mission.start',
        ok: false,
        code: 'command.execution_unavailable',
        message: 'Command execution is unavailable.',
      },
    });
  });
});
