import { describe, expect, it, vi } from 'vitest';
import type { Mission } from '@headquarters/shared';
import type { ChangeMissionStateCommand, CreateMissionCommand, StartMissionCommand } from './MissionCommands';
import type { MissionCommandExecutionContext } from './MissionCommandHandler';
import { MissionCommandDispatcher } from './MissionCommandDispatcher';
import { MissionCommandExecutionHandler } from './MissionCommandExecutionHandler';
import { MissionKernel } from './MissionKernel';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-27T12:00:00.000Z';
const context: MissionCommandExecutionContext = {
  now: () => requestedAt,
};

function createMission(state: Mission['state'] = 'idle'): Mission {
  return {
    id: missionId,
    codename: 'Execution Mission',
    state,
    createdAt: '2026-06-27T11:00:00.000Z',
    updatedAt: '2026-06-27T11:00:00.000Z',
  };
}

describe('MissionCommandExecutionHandler', () => {
  it('creates a deterministic mission result without persistence', () => {
    const handler = new MissionCommandExecutionHandler(new MissionKernel());
    const command: CreateMissionCommand = {
      type: 'mission.create',
      commandId,
      requestedAt,
      codename: 'Created Mission',
      campaignId: '33333333-3333-4333-8333-333333333333',
      objective: 'Create deterministic result',
    };

    expect(handler.handle({ command, validated: true }, context)).toEqual({
      ok: true,
      commandId,
      result: {
        mission: {
          id: commandId,
          campaignId: '33333333-3333-4333-8333-333333333333',
          codename: 'Created Mission',
          state: 'idle',
          objective: 'Create deterministic result',
          createdAt: requestedAt,
          updatedAt: requestedAt,
        },
      },
    });
  });

  it('handles valid mission transition commands through the dispatcher', () => {
    const loadMission = vi.fn(() => createMission());
    const handler = new MissionCommandExecutionHandler(new MissionKernel(), { loadMission });
    const dispatcher = new MissionCommandDispatcher(handler);
    const command: StartMissionCommand = {
      type: 'mission.start',
      commandId,
      requestedAt,
      missionId,
    };

    expect(dispatcher.dispatch(command, context)).toEqual({
      ok: true,
      commandId,
      result: {
        mission: {
          ...createMission(),
          state: 'briefing',
          updatedAt: requestedAt,
        },
      },
    });
    expect(loadMission).toHaveBeenCalledTimes(1);
    expect(loadMission).toHaveBeenCalledWith(missionId);
  });

  it('fails safely for invalid mission transitions', () => {
    const handler = new MissionCommandExecutionHandler(new MissionKernel(), {
      loadMission: () => createMission('idle'),
    });
    const command: ChangeMissionStateCommand = {
      type: 'mission.state.change',
      commandId,
      requestedAt,
      missionId,
      targetState: 'archived',
    };

    expect(handler.handle({ command, validated: true }, context)).toEqual({
      ok: false,
      commandId,
      code: 'mission.transition_invalid',
      message: `Invalid mission transition for ${missionId}: idle -> archived`,
    });
  });

  it('fails safely when a mission cannot be loaded', () => {
    const handler = new MissionCommandExecutionHandler(new MissionKernel(), {
      loadMission: () => undefined,
    });
    const command: StartMissionCommand = {
      type: 'mission.start',
      commandId,
      requestedAt,
      missionId,
    };

    expect(handler.handle({ command, validated: true }, context)).toEqual({
      ok: false,
      commandId,
      code: 'mission.not_found',
      message: `Mission ${missionId} was not found.`,
    });
  });

  it('does not execute invalid commands routed through the dispatcher', () => {
    const loadMission = vi.fn(() => createMission());
    const handler = new MissionCommandExecutionHandler(new MissionKernel(), { loadMission });
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
    ).toMatchObject({
      ok: false,
      code: 'command.validation_failed',
    });
    expect(loadMission).not.toHaveBeenCalled();
  });
});
