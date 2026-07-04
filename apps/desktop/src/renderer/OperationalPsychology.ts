import type { MissionState } from '@headquarters/shared';
import type { CommanderShellRoomId } from './CommanderShell';
import { getRoomIdentityProfile } from './RoomIdentity';

export type OperationalMindset =
  | 'preparation'
  | 'patience'
  | 'decision'
  | 'reflection'
  | 'closure'
  | 'command'
  | 'record'
  | 'law'
  | 'growth'
  | 'security'
  | 'analysis'
  | 'systems';

export type CommanderPacing = 'slow' | 'measured' | 'direct' | 'reflective' | 'formal' | 'quiet';

export interface OperationalPsychologyProfile {
  readonly room: CommanderShellRoomId;
  readonly mindset: OperationalMindset;
  readonly pacing: CommanderPacing;
  readonly operatorPresence: string;
  readonly focusInstruction: string;
  readonly environmentalReinforcement: string;
  readonly deliberateFriction?: string | undefined;
  readonly ceremony?: string | undefined;
}

export interface OperationalPsychologyInput {
  readonly room: CommanderShellRoomId;
  readonly missionState?: MissionState | undefined;
  readonly elapsedMinutes?: number | undefined;
}

export function buildOperationalPsychologyProfile(input: OperationalPsychologyInput): OperationalPsychologyProfile {
  const identity = getRoomIdentityProfile(input.room);
  const base = getRoomPsychology(input.room);
  const longSessionNote = input.elapsedMinutes !== undefined && input.elapsedMinutes >= 45
    ? ' Long session awareness active: pause before escalation.'
    : '';

  return {
    ...base,
    operatorPresence: `${base.operatorPresence}${longSessionNote}`,
    environmentalReinforcement: `${identity.label}: ${base.environmentalReinforcement}`,
    ceremony: getMissionCeremonyPsychology(input.missionState, input.room),
  };
}

export function buildCommanderPacingLine(profile: OperationalPsychologyProfile): string {
  if (profile.pacing === 'slow') return `${profile.operatorPresence} Commander pacing is slow. Silence is intentional.`;
  if (profile.pacing === 'direct') return `${profile.operatorPresence} Commander pacing is direct. Decide only from doctrine.`;
  if (profile.pacing === 'reflective') return `${profile.operatorPresence} Commander pacing is reflective. Outcome waits behind behavior.`;
  if (profile.pacing === 'formal') return `${profile.operatorPresence} Commander pacing is formal. The record is permanent.`;
  return `${profile.operatorPresence} Commander pacing is measured. Follow the next operational instruction.`;
}

export function requiresDeliberateConfirmation(profile: OperationalPsychologyProfile): boolean {
  return profile.deliberateFriction !== undefined;
}

function getRoomPsychology(room: CommanderShellRoomId): Omit<OperationalPsychologyProfile, 'ceremony'> {
  if (room === 'ready-room') {
    return {
      room,
      mindset: 'preparation',
      pacing: 'slow',
      operatorPresence: 'Remain seated in the Ready Room.',
      focusInstruction: 'Plan calmly before Headquarters commits resources.',
      environmentalReinforcement: 'Preparation, calm, and planning stay visually primary.',
    };
  }

  if (room === 'observation') {
    return {
      room,
      mindset: 'patience',
      pacing: 'slow',
      operatorPresence: 'Remain in Observation.',
      focusInstruction: 'Report only visible evidence. Prediction stays silent.',
      environmentalReinforcement: 'Nonessential controls stay quiet while evidence is gathered.',
    };
  }

  if (room === 'war-room') {
    return {
      room,
      mindset: 'decision',
      pacing: 'direct',
      operatorPresence: 'Stay in the command seat.',
      focusInstruction: 'Authorization must come from doctrine, not pressure.',
      environmentalReinforcement: 'Authorization, invalidation, and Guardian status take priority.',
      deliberateFriction: 'Authorization requires deliberate confirmation.',
    };
  }

  if (room === 'debrief') {
    return {
      room,
      mindset: 'reflection',
      pacing: 'reflective',
      operatorPresence: 'Return to the Debrief Theater.',
      focusInstruction: 'The trade is over. The lesson is not.',
      environmentalReinforcement: 'Reflection prompts stay primary and timeline remains secondary.',
      deliberateFriction: 'Mission completion requires behavior-first reflection.',
    };
  }

  if (room === 'archive') {
    return {
      room,
      mindset: 'closure',
      pacing: 'formal',
      operatorPresence: 'Stand before the Archive vault.',
      focusInstruction: 'Evidence secured. History preserved.',
      environmentalReinforcement: 'Permanent record language replaces editable workflow language.',
      deliberateFriction: 'Archive sealing requires deliberate confirmation.',
    };
  }

  if (room === 'journal') {
    return {
      room,
      mindset: 'record',
      pacing: 'reflective',
      operatorPresence: 'Sit at the command log.',
      focusInstruction: 'Write before memory changes.',
      environmentalReinforcement: 'The writing surface remains warmer and quieter than operations.',
    };
  }

  if (room === 'doctrine') {
    return {
      room,
      mindset: 'law',
      pacing: 'formal',
      operatorPresence: 'Enter the Doctrine Chamber.',
      focusInstruction: 'Nothing becomes law without review.',
      environmentalReinforcement: 'Candidate promotion is formal, slow, and evidence bound.',
      deliberateFriction: 'Doctrine promotion requires deliberate confirmation.',
    };
  }

  if (room === 'academy') {
    return {
      room,
      mindset: 'growth',
      pacing: 'measured',
      operatorPresence: 'Enter the Academy floor.',
      focusInstruction: 'Growth is earned through behavior.',
      environmentalReinforcement: 'Recognition is primary; XP supports the evidence.',
    };
  }

  if (room === 'guardian') {
    return {
      room,
      mindset: 'security',
      pacing: 'direct',
      operatorPresence: 'Guardian is watching.',
      focusInstruction: 'Risk limits are protective, not optional.',
      environmentalReinforcement: 'Security signals remain serious without panic.',
    };
  }

  if (room === 'intelligence') {
    return {
      room,
      mindset: 'analysis',
      pacing: 'measured',
      operatorPresence: 'Remain in the Intelligence Office.',
      focusInstruction: 'Patterns are evidence, not orders.',
      environmentalReinforcement: 'Connection and classification signals stay analytical.',
    };
  }

  return {
    room,
    mindset: room === 'settings' ? 'systems' : 'command',
    pacing: 'measured',
    operatorPresence: 'Return to the Command Chair.',
    focusInstruction: 'One objective remains primary.',
    environmentalReinforcement: 'Commander, mission, and next action stay central.',
  };
}

function getMissionCeremonyPsychology(
  missionState: MissionState | undefined,
  room: CommanderShellRoomId,
): string | undefined {
  if (missionState === undefined && room === 'command') return 'Mission Accepted ceremony is standing by.';
  if (missionState === 'ready') return 'Mission Accepted: preparation is complete.';
  if (missionState === 'authorization') return 'Observation Complete: evidence is ready for responsibility.';
  if (missionState === 'deployed') return 'Authorization Granted: execution authority is active.';
  if (missionState === 'return_to_base') return 'Mission Returned: debrief before closure.';
  if (missionState === 'archived') return 'Mission Archived: record sealed.';
  return undefined;
}
