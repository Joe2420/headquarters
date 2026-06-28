import { describe, expect, it } from 'vitest';
import type { Mission } from '@headquarters/shared';
import type { ChangeMissionStateCommand, StartMissionCommand } from './MissionCommands';
import type { MissionCommandExecutionContext } from './MissionCommandHandler';
import { MissionCommandExecutionHandler } from './MissionCommandExecutionHandler';
import { MissionCommandExecutionOrchestrator } from './MissionCommandExecutionOrchestrator';
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
    codename: 'Orchestration Mission',
    state,
    createdAt: '2026-06-27T11:00:00.000Z',
    updatedAt: '2026-06-27T11:00:00.000Z',
  };
}

describe('MissionCommandExecutionOrchestrator', () => {
  it('returns execution result and event candidate for successful commands', () => {
    const handler = new MissionCommandExecutionHandler(new MissionKernel(), {
      loadMission: () => createMission(),
    });
    const orchestrator = new MissionCommandExecutionOrchestrator(handler);
    const command: StartMissionCommand = {
      type: 'mission.start',
      commandId,
      requestedAt,
      missionId,
    };
    const expectedMission = {
      ...createMission(),
      state: 'briefing',
      updatedAt: requestedAt,
    };

    expect(orchestrator.execute(command, context)).toEqual({
      executionResult: {
        ok: true,
        commandId,
        result: {
          mission: expectedMission,
        },
      },
      eventCandidate: {
        type: 'mission.command.succeeded',
        payload: {
          commandId,
          commandType: 'mission.start',
          ok: true,
          result: {
            mission: expectedMission,
          },
        },
      },
    });
  });

  it('returns execution failure result and event candidate for failed commands', () => {
    const handler = new MissionCommandExecutionHandler(new MissionKernel(), {
      loadMission: () => createMission('idle'),
    });
    const orchestrator = new MissionCommandExecutionOrchestrator(handler);
    const command: ChangeMissionStateCommand = {
      type: 'mission.state.change',
      commandId,
      requestedAt,
      missionId,
      targetState: 'archived',
    };

    expect(orchestrator.execute(command, context)).toEqual({
      executionResult: {
        ok: false,
        commandId,
        code: 'mission.transition_invalid',
        message: `Invalid mission transition for ${missionId}: idle -> archived`,
      },
      eventCandidate: {
        type: 'mission.command.failed',
        payload: {
          commandId,
          commandType: 'mission.state.change',
          ok: false,
          code: 'mission.transition_invalid',
          message: `Invalid mission transition for ${missionId}: idle -> archived`,
        },
      },
    });
  });
});
