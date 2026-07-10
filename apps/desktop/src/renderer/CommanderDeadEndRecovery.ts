import type { CommanderShellRoomId } from './CommanderShell';

export interface CommanderRecoveryInput {
  readonly room: CommanderShellRoomId;
  readonly missionState?: string | undefined;
  readonly transmission: string;
}

export interface CommanderRecoveryDirective {
  readonly id: string;
  readonly room: CommanderShellRoomId;
  readonly nextAction: string;
  readonly message: string;
}

const ROOM_RECOVERY_ACTIONS: Record<CommanderShellRoomId, string> = {
  command: 'Return to the Command Chair and state the mission codename or objective.',
  'ready-room': 'Answer the current briefing question. Headquarters needs operational context before Observation.',
  observation: 'Report visible evidence only. Price direction, structure, liquidity, or invalidation are useful.',
  'war-room': 'State authorization reasoning, invalidation, and the rule protecting the decision.',
  debrief: 'Complete the behavior summary, discipline notes, and lesson before archive.',
  archive: 'Confirm archive intent or return to the current mission room.',
  journal: 'Write one clear operational note. Keep the log factual.',
  doctrine: 'Review the candidate, approve it, reject it, or return it for revision.',
  academy: 'Review recognition and consistency evidence. No mission action is required here.',
  guardian: 'Review the active Guardian warning and return to the mission when ready.',
  intelligence: 'Review the current pattern summary. Do not treat it as authorization.',
  settings: 'Adjust settings only if the operation requires it.',
};

export function buildCommanderDeadEndRecovery(input: CommanderRecoveryInput): CommanderRecoveryDirective {
  const normalized = input.transmission.trim().toLowerCase();
  const isUnclear = normalized.length < 3
    || ['help', 'what', 'next', '?', 'stuck'].some((token) => normalized.includes(token));
  const nextAction = ROOM_RECOVERY_ACTIONS[input.room];
  const stateClause = input.missionState ? ` Mission state: ${input.missionState.replaceAll('_', ' ')}.` : '';
  const prefix = isUnclear
    ? 'Instruction unclear. Commander is restoring the path.'
    : 'Transmission logged, but it does not advance the current room.';

  return {
    id: `recovery:${input.room}:${input.missionState ?? 'none'}`,
    room: input.room,
    nextAction,
    message: `${prefix}${stateClause} ${nextAction}`,
  };
}
