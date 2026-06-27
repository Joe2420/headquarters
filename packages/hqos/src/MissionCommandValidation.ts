import type { MissionState } from '@headquarters/shared';
import type { MissionCommand, MissionCommandType } from './MissionCommands';
import { MISSION_STATES } from './MissionKernel';

export type MissionCommandValidationCode =
  | 'command.not_object'
  | 'command.type.invalid'
  | 'field.required'
  | 'field.invalid_string'
  | 'field.invalid_timestamp'
  | 'field.invalid_mission_state';

export interface MissionCommandValidationError {
  readonly path: string;
  readonly code: MissionCommandValidationCode;
  readonly message: string;
}

export interface MissionCommandValidationResult {
  readonly valid: boolean;
  readonly errors: readonly MissionCommandValidationError[];
}

const MISSION_COMMAND_TYPES = [
  'mission.create',
  'mission.authorization.request',
  'mission.start',
  'mission.state.change',
  'mission.complete',
  'mission.abort',
] as const satisfies readonly MissionCommandType[];
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function validateMissionCommand(command: unknown): MissionCommandValidationResult {
  if (!isRecord(command)) {
    return invalid([
      {
        path: 'command',
        code: 'command.not_object',
        message: 'Mission command must be an object.',
      },
    ]);
  }

  const errors: MissionCommandValidationError[] = [];
  validateCommandBase(command, errors);

  if (!isMissionCommandType(command.type)) {
    errors.push({
      path: 'type',
      code: 'command.type.invalid',
      message: 'Mission command type is invalid.',
    });
    return toResult(errors);
  }

  validateCommandByType(command.type, command, errors);

  return toResult(errors);
}

function validateCommandBase(command: Record<string, unknown>, errors: MissionCommandValidationError[]): void {
  validateRequiredString(command, 'commandId', errors);
  validateTimestamp(command, 'requestedAt', errors);
  validateOptionalString(command, 'correlationId', errors);
  validateOptionalString(command, 'causationId', errors);
}

function validateCommandByType(
  type: MissionCommandType,
  command: Record<string, unknown>,
  errors: MissionCommandValidationError[],
): void {
  switch (type) {
    case 'mission.create':
      validateRequiredString(command, 'codename', errors);
      validateOptionalString(command, 'campaignId', errors);
      validateOptionalString(command, 'objective', errors);
      break;
    case 'mission.authorization.request':
    case 'mission.start':
      validateMissionId(command, errors);
      validateOptionalString(command, 'reason', errors);
      break;
    case 'mission.state.change':
      validateMissionId(command, errors);
      validateMissionState(command, 'targetState', errors);
      validateOptionalString(command, 'reason', errors);
      break;
    case 'mission.complete':
      validateMissionId(command, errors);
      validateOptionalString(command, 'outcome', errors);
      break;
    case 'mission.abort':
      validateMissionId(command, errors);
      validateRequiredString(command, 'reason', errors);
      break;
  }
}

function validateMissionId(command: Record<string, unknown>, errors: MissionCommandValidationError[]): void {
  validateRequiredString(command, 'missionId', errors);
}

function validateMissionState(
  command: Record<string, unknown>,
  path: string,
  errors: MissionCommandValidationError[],
): void {
  const value = command[path];
  if (value === undefined) {
    errors.push({
      path,
      code: 'field.required',
      message: `${path} is required.`,
    });
    return;
  }

  if (!isMissionState(value)) {
    errors.push({
      path,
      code: 'field.invalid_mission_state',
      message: `${path} must be a valid mission state.`,
    });
  }
}

function validateTimestamp(
  command: Record<string, unknown>,
  path: string,
  errors: MissionCommandValidationError[],
): void {
  const value = command[path];
  if (value === undefined) {
    errors.push({
      path,
      code: 'field.required',
      message: `${path} is required.`,
    });
    return;
  }

  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    !ISO_DATE_TIME_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    errors.push({
      path,
      code: 'field.invalid_timestamp',
      message: `${path} must be a valid ISO date-time string.`,
    });
  }
}

function validateRequiredString(
  command: Record<string, unknown>,
  path: string,
  errors: MissionCommandValidationError[],
): void {
  const value = command[path];
  if (value === undefined) {
    errors.push({
      path,
      code: 'field.required',
      message: `${path} is required.`,
    });
    return;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push({
      path,
      code: 'field.invalid_string',
      message: `${path} must be a non-empty string.`,
    });
  }
}

function validateOptionalString(
  command: Record<string, unknown>,
  path: string,
  errors: MissionCommandValidationError[],
): void {
  const value = command[path];
  if (value !== undefined && (typeof value !== 'string' || value.trim().length === 0)) {
    errors.push({
      path,
      code: 'field.invalid_string',
      message: `${path} must be a non-empty string when provided.`,
    });
  }
}

function isMissionCommandType(value: unknown): value is MissionCommandType {
  return typeof value === 'string' && (MISSION_COMMAND_TYPES as readonly string[]).includes(value);
}

function isMissionState(value: unknown): value is MissionState {
  return typeof value === 'string' && (MISSION_STATES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toResult(errors: MissionCommandValidationError[]): MissionCommandValidationResult {
  return errors.length === 0 ? valid() : invalid(errors);
}

function valid(): MissionCommandValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

function invalid(errors: readonly MissionCommandValidationError[]): MissionCommandValidationResult {
  return {
    valid: false,
    errors,
  };
}

export function isValidMissionCommand(command: unknown): command is MissionCommand {
  return validateMissionCommand(command).valid;
}
