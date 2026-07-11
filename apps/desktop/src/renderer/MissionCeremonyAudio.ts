import type { AudioCueId, AudioEvent, AudioPriority } from './AudioEvents';
import { createAudioEvent } from './AudioEvents';
import type { CommanderShellRoomId } from './CommanderShell';
import type { CommanderCeremonyDialogue, CommanderCeremonyMoment } from './CommanderCeremonyDialogue';
import type { MissionCeremony } from './HeadquartersAtmosphere';

export type MissionCeremonyAudioMoment =
  | 'report_for_duty_accepted'
  | 'mission_created'
  | 'briefing_complete'
  | 'observation_started'
  | 'observation_complete'
  | 'authorization_requested'
  | 'authorization_granted'
  | 'return_to_base'
  | 'debrief_complete'
  | 'mission_archived';

const ceremonyCueByMoment: Record<MissionCeremonyAudioMoment, AudioCueId> = {
  report_for_duty_accepted: 'ceremony_report_for_duty_accepted',
  mission_created: 'ceremony_mission_created',
  briefing_complete: 'ceremony_briefing_complete',
  observation_started: 'ceremony_observation_started',
  observation_complete: 'ceremony_observation_complete',
  authorization_requested: 'ceremony_authorization_requested',
  authorization_granted: 'ceremony_authorization_granted',
  return_to_base: 'ceremony_return_to_base',
  debrief_complete: 'ceremony_debrief_complete',
  mission_archived: 'ceremony_archive_seal',
};

const ceremonyPriorityByMoment: Record<MissionCeremonyAudioMoment, AudioPriority> = {
  report_for_duty_accepted: 'normal',
  mission_created: 'normal',
  briefing_complete: 'normal',
  observation_started: 'normal',
  observation_complete: 'normal',
  authorization_requested: 'high',
  authorization_granted: 'high',
  return_to_base: 'normal',
  debrief_complete: 'normal',
  mission_archived: 'high',
};

const ceremonyRoomByMoment: Record<MissionCeremonyAudioMoment, CommanderShellRoomId> = {
  report_for_duty_accepted: 'command',
  mission_created: 'ready-room',
  briefing_complete: 'ready-room',
  observation_started: 'observation',
  observation_complete: 'observation',
  authorization_requested: 'war-room',
  authorization_granted: 'war-room',
  return_to_base: 'debrief',
  debrief_complete: 'debrief',
  mission_archived: 'archive',
};

export function resolveMissionCeremonyCue(moment: MissionCeremonyAudioMoment | string): AudioCueId | undefined {
  return isMissionCeremonyAudioMoment(moment) ? ceremonyCueByMoment[moment] : undefined;
}

export function buildMissionCeremonyAudioEvent(
  moment: MissionCeremonyAudioMoment,
  createdAt = '2026-07-04T00:00:00.000Z',
): AudioEvent {
  return createAudioEvent({
    type: 'ceremony_cue',
    cueId: ceremonyCueByMoment[moment],
    channel: 'ceremony',
    priority: ceremonyPriorityByMoment[moment],
    createdAt,
    room: ceremonyRoomByMoment[moment],
    reason: `Mission ceremony audio hook: ${moment}.`,
  });
}

export function mapMissionCeremonyToAudioMoment(ceremony?: MissionCeremony | undefined): MissionCeremonyAudioMoment | undefined {
  if (ceremony === undefined) return undefined;
  if (ceremony.id === 'ceremony:report-accepted') return 'report_for_duty_accepted';
  if (ceremony.id === 'ceremony:mission-created') return 'mission_created';
  if (ceremony.id === 'ceremony:briefing-complete') return 'briefing_complete';
  if (ceremony.id === 'ceremony:observation-begins') return 'observation_started';
  if (ceremony.id === 'ceremony:observation-complete') return 'observation_complete';
  if (ceremony.id === 'ceremony:authorization-requested') return 'authorization_requested';
  if (ceremony.id === 'ceremony:authorization-granted') return 'authorization_granted';
  if (ceremony.id === 'ceremony:return-to-base') return 'return_to_base';
  if (ceremony.id === 'ceremony:debrief-complete') return 'debrief_complete';
  if (ceremony.id === 'ceremony:mission-archived') return 'mission_archived';
  return undefined;
}

export function mapCommanderCeremonyDialogueToAudioMoment(
  dialogue?: CommanderCeremonyDialogue | undefined,
): MissionCeremonyAudioMoment | undefined {
  if (dialogue === undefined) return undefined;
  return mapCommanderCeremonyMomentToAudioMoment(dialogue.moment);
}

export function buildCommanderCeremonyAudioEvent(
  dialogue: CommanderCeremonyDialogue,
  createdAt = '2026-07-04T00:00:00.000Z',
): AudioEvent | undefined {
  const moment = mapCommanderCeremonyDialogueToAudioMoment(dialogue);
  return moment ? buildMissionCeremonyAudioEvent(moment, createdAt) : undefined;
}

function mapCommanderCeremonyMomentToAudioMoment(
  moment: CommanderCeremonyMoment,
): MissionCeremonyAudioMoment | undefined {
  if (moment === 'report_accepted') return 'report_for_duty_accepted';
  if (moment === 'mission_created') return 'mission_created';
  if (moment === 'briefing_complete') return 'briefing_complete';
  if (moment === 'observation_started') return 'observation_started';
  if (moment === 'observation_complete') return 'observation_complete';
  if (moment === 'authorization_requested') return 'authorization_requested';
  if (moment === 'authorization_granted') return 'authorization_granted';
  if (moment === 'return_to_base') return 'return_to_base';
  if (moment === 'debrief_complete') return 'debrief_complete';
  if (moment === 'mission_archived') return 'mission_archived';
  return undefined;
}

function isMissionCeremonyAudioMoment(value: string): value is MissionCeremonyAudioMoment {
  return value === 'report_for_duty_accepted'
    || value === 'mission_created'
    || value === 'briefing_complete'
    || value === 'observation_started'
    || value === 'observation_complete'
    || value === 'authorization_requested'
    || value === 'authorization_granted'
    || value === 'return_to_base'
    || value === 'debrief_complete'
    || value === 'mission_archived';
}
