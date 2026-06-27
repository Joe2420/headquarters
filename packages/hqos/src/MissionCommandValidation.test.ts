import { describe, expect, it } from 'vitest';
import type { MissionCommand } from './MissionCommands';
import { isValidMissionCommand, validateMissionCommand } from './MissionCommandValidation';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-27T12:00:00.000Z';

const validCommands: MissionCommand[] = [
  {
    type: 'mission.create',
    commandId,
    requestedAt,
    codename: 'Validation Mission',
    campaignId: '33333333-3333-4333-8333-333333333333',
    objective: 'Validate command DTOs',
  },
  {
    type: 'mission.authorization.request',
    commandId,
    requestedAt,
    missionId,
    reason: 'Authorization requested',
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
    reason: 'Begin observation',
  },
  {
    type: 'mission.complete',
    commandId,
    requestedAt,
    missionId,
    outcome: 'Completed',
  },
  {
    type: 'mission.abort',
    commandId,
    requestedAt,
    missionId,
    reason: 'Abort requested',
  },
];

describe('MissionCommandValidation', () => {
  it('accepts every valid mission command DTO', () => {
    for (const command of validCommands) {
      expect(validateMissionCommand(command)).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it('rejects non-object and invalid command types deterministically', () => {
    expect(validateMissionCommand(undefined)).toEqual({
      valid: false,
      errors: [
        {
          path: 'command',
          code: 'command.not_object',
          message: 'Mission command must be an object.',
        },
      ],
    });

    expect(
      validateMissionCommand({
        type: 'mission.unknown',
        commandId,
        requestedAt,
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          path: 'type',
          code: 'command.type.invalid',
          message: 'Mission command type is invalid.',
        },
      ],
    });
  });

  it('validates required base fields and timestamp format', () => {
    expect(
      validateMissionCommand({
        type: 'mission.start',
        commandId: '',
        requestedAt: 'not-a-date',
        missionId,
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          path: 'commandId',
          code: 'field.invalid_string',
          message: 'commandId must be a non-empty string.',
        },
        {
          path: 'requestedAt',
          code: 'field.invalid_timestamp',
          message: 'requestedAt must be a valid ISO date-time string.',
        },
      ],
    });
  });

  it('validates command-specific required fields', () => {
    expect(
      validateMissionCommand({
        type: 'mission.create',
        commandId,
        requestedAt,
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          path: 'codename',
          code: 'field.required',
          message: 'codename is required.',
        },
      ],
    });

    expect(
      validateMissionCommand({
        type: 'mission.abort',
        commandId,
        requestedAt,
        missionId,
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          path: 'reason',
          code: 'field.required',
          message: 'reason is required.',
        },
      ],
    });
  });

  it('validates mission id where required', () => {
    expect(
      validateMissionCommand({
        type: 'mission.authorization.request',
        commandId,
        requestedAt,
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          path: 'missionId',
          code: 'field.required',
          message: 'missionId is required.',
        },
      ],
    });
  });

  it('validates target mission state for state-change commands', () => {
    expect(
      validateMissionCommand({
        type: 'mission.state.change',
        commandId,
        requestedAt,
        missionId,
        targetState: 'not_a_state',
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          path: 'targetState',
          code: 'field.invalid_mission_state',
          message: 'targetState must be a valid mission state.',
        },
      ],
    });
  });

  it('narrows valid unknown commands with a type guard', () => {
    const command: unknown = validCommands[0];

    expect(isValidMissionCommand(command)).toBe(true);
    if (isValidMissionCommand(command)) {
      expect(command.type).toBe('mission.create');
    }
  });
});
