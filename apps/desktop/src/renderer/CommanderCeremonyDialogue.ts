import type { MissionState } from '@headquarters/shared';
import type { CommanderShellRoomId } from './CommanderShell';

export type CommanderCeremonyMoment =
  | 'report_accepted'
  | 'mission_created'
  | 'briefing_complete'
  | 'observation_started'
  | 'observation_complete'
  | 'authorization_requested'
  | 'authorization_granted'
  | 'return_to_base'
  | 'debrief_complete'
  | 'mission_archived';

export type CommanderCeremonyTone = 'formal' | 'calm' | 'protective' | 'direct' | 'reflective';

export interface CommanderCeremonyDialogue {
  readonly moment: CommanderCeremonyMoment;
  readonly room: CommanderShellRoomId;
  readonly label: string;
  readonly commanderLine: string;
  readonly supportingLine: string;
  readonly tone: CommanderCeremonyTone;
}

const ceremonyDialogueByMoment: Record<CommanderCeremonyMoment, CommanderCeremonyDialogue> = {
  report_accepted: {
    moment: 'report_accepted',
    room: 'command',
    label: 'Report Accepted',
    commanderLine: 'Operator seated. Headquarters is awake.',
    supportingLine: 'Commander will not move until a mission is declared.',
    tone: 'formal',
  },
  mission_created: {
    moment: 'mission_created',
    room: 'ready-room',
    label: 'Mission Created',
    commanderLine: 'Mission received. Prepare before movement.',
    supportingLine: 'The Ready Room now owns the briefing standard.',
    tone: 'calm',
  },
  briefing_complete: {
    moment: 'briefing_complete',
    room: 'ready-room',
    label: 'Briefing Complete',
    commanderLine: 'Operational briefing complete.',
    supportingLine: 'Observation is authorized. Evidence comes before action.',
    tone: 'formal',
  },
  observation_started: {
    moment: 'observation_started',
    room: 'observation',
    label: 'Observation Begins',
    commanderLine: 'Observation has begun.',
    supportingLine: 'Do not predict. Report only what is visible.',
    tone: 'calm',
  },
  observation_complete: {
    moment: 'observation_complete',
    room: 'observation',
    label: 'Observation Complete',
    commanderLine: 'Observation complete.',
    supportingLine: 'Evidence appears sufficient. War Room may evaluate responsibility.',
    tone: 'formal',
  },
  authorization_requested: {
    moment: 'authorization_requested',
    room: 'war-room',
    label: 'Authorization Requested',
    commanderLine: 'Authorization is under review.',
    supportingLine: 'Doctrine, invalidation, and Guardian restrictions decide from here.',
    tone: 'direct',
  },
  authorization_granted: {
    moment: 'authorization_granted',
    room: 'war-room',
    label: 'Authorization Granted',
    commanderLine: 'Authorization granted.',
    supportingLine: 'Decision authority transferred. Execute only the declared plan.',
    tone: 'direct',
  },
  return_to_base: {
    moment: 'return_to_base',
    room: 'debrief',
    label: 'Return To Base',
    commanderLine: 'Return to base confirmed.',
    supportingLine: 'The trade is over. The lesson is not.',
    tone: 'reflective',
  },
  debrief_complete: {
    moment: 'debrief_complete',
    room: 'debrief',
    label: 'Debrief Complete',
    commanderLine: 'Debrief accepted.',
    supportingLine: 'Behavior, discipline, and lesson are ready for institutional memory.',
    tone: 'reflective',
  },
  mission_archived: {
    moment: 'mission_archived',
    room: 'archive',
    label: 'Mission Archived',
    commanderLine: 'Mission record sealed.',
    supportingLine: 'History preserved. Headquarters can learn from this operation later.',
    tone: 'formal',
  },
};

export function getCommanderCeremonyDialogue(moment: CommanderCeremonyMoment): CommanderCeremonyDialogue {
  return ceremonyDialogueByMoment[moment];
}

export function listCommanderCeremonyDialogues(): readonly CommanderCeremonyDialogue[] {
  return Object.values(ceremonyDialogueByMoment);
}

export function mapMissionStateToCommanderCeremonyMoment(
  state?: MissionState | undefined,
): CommanderCeremonyMoment | undefined {
  if (state === undefined) return 'report_accepted';
  if (state === 'briefing') return 'mission_created';
  if (state === 'ready') return 'briefing_complete';
  if (state === 'observation') return 'observation_started';
  if (state === 'authorization') return 'authorization_requested';
  if (state === 'deployed') return 'authorization_granted';
  if (state === 'return_to_base') return 'return_to_base';
  if (state === 'debrief') return 'debrief_complete';
  if (state === 'archived') return 'mission_archived';
  return undefined;
}

export function buildCommanderCeremonyDialogueForMissionState(
  state?: MissionState | undefined,
): CommanderCeremonyDialogue | undefined {
  const moment = mapMissionStateToCommanderCeremonyMoment(state);
  return moment ? getCommanderCeremonyDialogue(moment) : undefined;
}
