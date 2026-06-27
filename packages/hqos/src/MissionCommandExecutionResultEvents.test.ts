import { describe, expect, it } from 'vitest';
import type { Mission } from '@headquarters/shared';
import type { StartMissionCommand } from './MissionCommands';
import type { MissionCommandHandlerFailure, MissionCommandHandlerSuccess } from './MissionCommandHandler';
import type { MissionCommandExecutionResult } from './MissionCommandExecutionHandler';
import { mapMissionCommandExecutionResultToEventCandidate } from './MissionCommandExecutionResultEvents';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-27T12:00:00.000Z';

const command: StartMissionCommand = {
  type: 'mission.start',
  commandId,
  requestedAt,
  missionId,
};

const mission: Mission = {
  id: missionId,
  codename: 'Execution Result Mission',
  state: 'briefing',
  createdAt: '2026-06-27T11:00:00.000Z',
  updatedAt: requestedAt,
};

describe('MissionCommandExecutionResultEvents', () => {
  it('maps concrete execution success results to event payload candidates', () => {
    const result: MissionCommandHandlerSuccess<MissionCommandExecutionResult> = {
      ok: true,
      commandId,
      result: {
        mission,
      },
    };

    expect(mapMissionCommandExecutionResultToEventCandidate(command, result)).toEqual({
      type: 'mission.command.succeeded',
      payload: {
        commandId,
        commandType: 'mission.start',
        ok: true,
        result: {
          mission,
        },
      },
    });
  });

  it('maps concrete execution failure results to event payload candidates', () => {
    const result: MissionCommandHandlerFailure = {
      ok: false,
      commandId,
      code: 'mission.transition_invalid',
      message: 'Invalid mission transition.',
    };

    expect(mapMissionCommandExecutionResultToEventCandidate(command, result)).toEqual({
      type: 'mission.command.failed',
      payload: {
        commandId,
        commandType: 'mission.start',
        ok: false,
        code: 'mission.transition_invalid',
        message: 'Invalid mission transition.',
      },
    });
  });
});
