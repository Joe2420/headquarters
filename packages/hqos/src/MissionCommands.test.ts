import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  AbortMissionCommand,
  ChangeMissionStateCommand,
  CompleteMissionCommand,
  CreateMissionCommand,
  MissionCommand,
  MissionCommandBase,
  MissionCommandType,
  RequestMissionAuthorizationCommand,
  StartMissionCommand,
} from './MissionCommands';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-27T12:00:00.000Z';

function describeCommand(command: MissionCommand): string {
  switch (command.type) {
    case 'mission.create':
      return command.codename;
    case 'mission.authorization.request':
    case 'mission.start':
    case 'mission.complete':
    case 'mission.abort':
      return command.missionId;
    case 'mission.state.change':
      return command.targetState;
  }
}

describe('MissionCommands', () => {
  it('defines stable mission command type identifiers', () => {
    const commandTypes: MissionCommandType[] = [
      'mission.create',
      'mission.authorization.request',
      'mission.start',
      'mission.state.change',
      'mission.complete',
      'mission.abort',
    ];

    expect(commandTypes).toEqual([
      'mission.create',
      'mission.authorization.request',
      'mission.start',
      'mission.state.change',
      'mission.complete',
      'mission.abort',
    ]);
  });

  it('types each mission command DTO without handler behavior', () => {
    const commands: MissionCommand[] = [
      {
        type: 'mission.create',
        commandId,
        requestedAt,
        codename: 'Command DTO Mission',
        objective: 'Define inputs only',
      },
      {
        type: 'mission.authorization.request',
        commandId,
        requestedAt,
        missionId,
        reason: 'Ready for authorization',
      },
      {
        type: 'mission.start',
        commandId,
        requestedAt,
        missionId,
      },
      {
        type: 'mission.state.change',
        commandId,
        requestedAt,
        missionId,
        targetState: 'observation',
      },
      {
        type: 'mission.complete',
        commandId,
        requestedAt,
        missionId,
        outcome: 'Mission complete',
      },
      {
        type: 'mission.abort',
        commandId,
        requestedAt,
        missionId,
        reason: 'Abort requested',
      },
    ];

    expect(commands.map((command) => command.type)).toEqual([
      'mission.create',
      'mission.authorization.request',
      'mission.start',
      'mission.state.change',
      'mission.complete',
      'mission.abort',
    ]);
  });

  it('keeps mission commands assignable to a shared base and discriminated union', () => {
    expectTypeOf<CreateMissionCommand>().toMatchTypeOf<MissionCommandBase>();
    expectTypeOf<RequestMissionAuthorizationCommand>().toMatchTypeOf<MissionCommandBase>();
    expectTypeOf<StartMissionCommand>().toMatchTypeOf<MissionCommandBase>();
    expectTypeOf<ChangeMissionStateCommand>().toMatchTypeOf<MissionCommandBase>();
    expectTypeOf<CompleteMissionCommand>().toMatchTypeOf<MissionCommandBase>();
    expectTypeOf<AbortMissionCommand>().toMatchTypeOf<MissionCommandBase>();

    const stateChange: MissionCommand = {
      type: 'mission.state.change',
      commandId,
      requestedAt,
      missionId,
      targetState: 'ready',
    };

    expect(describeCommand(stateChange)).toBe('ready');
  });
});
