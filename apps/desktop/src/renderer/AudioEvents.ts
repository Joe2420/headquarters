import type { MissionState } from '@headquarters/shared';
import type { CommanderShellRoomId } from './CommanderShell';

export type AudioEventType =
  | 'commander_voice'
  | 'transition_cue'
  | 'ceremony_cue'
  | 'guardian_alert'
  | 'ambient_cue'
  | 'ui_cue';

export type AudioChannel =
  | 'commander'
  | 'transition'
  | 'ceremony'
  | 'guardian'
  | 'ambient'
  | 'ui';

export type AudioPriority = 'low' | 'normal' | 'high' | 'critical';

export type AudioCueId =
  | 'commander_briefing_ready_room'
  | 'commander_guidance_general'
  | 'commander_warning_guardian'
  | 'commander_acknowledgement_progress'
  | 'commander_transition_war_room'
  | 'commander_debrief_complete'
  | 'commander_recognition_discipline'
  | 'commander_interruption'
  | 'transition_start'
  | 'transition_door_lock'
  | 'transition_door_close'
  | 'transition_hydraulic_motion'
  | 'transition_door_open'
  | 'transition_arrival'
  | 'cockpit_power'
  | 'cockpit_countdown'
  | 'cockpit_launch'
  | 'ceremony_report_for_duty_accepted'
  | 'ceremony_mission_created'
  | 'ceremony_briefing_complete'
  | 'ceremony_observation_started'
  | 'ceremony_observation_complete'
  | 'ceremony_authorization_requested'
  | 'ceremony_authorization_granted'
  | 'ceremony_return_to_base'
  | 'ceremony_debrief_complete'
  | 'ceremony_archive_seal'
  | 'guardian_alert_info'
  | 'guardian_alert_caution'
  | 'guardian_alert_warning'
  | 'guardian_alert_lockout'
  | 'ambient_room_tone'
  | 'ui_confirm';

export interface AudioEvent {
  readonly id: string;
  readonly type: AudioEventType;
  readonly cueId: AudioCueId;
  readonly channel: AudioChannel;
  readonly priority: AudioPriority;
  readonly createdAt: string;
  readonly room: CommanderShellRoomId;
  readonly missionPhase?: MissionState | undefined;
  readonly reason: string;
}

export interface CreateAudioEventInput {
  readonly type: AudioEventType;
  readonly cueId: AudioCueId;
  readonly channel: AudioChannel;
  readonly priority?: AudioPriority | undefined;
  readonly createdAt?: string | undefined;
  readonly room: CommanderShellRoomId;
  readonly missionPhase?: MissionState | undefined;
  readonly reason: string;
}

export function createAudioEvent(input: CreateAudioEventInput): AudioEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    id: buildAudioEventId(input.cueId, input.room, createdAt),
    type: input.type,
    cueId: input.cueId,
    channel: input.channel,
    priority: input.priority ?? 'normal',
    createdAt,
    room: input.room,
    ...(input.missionPhase === undefined ? {} : { missionPhase: input.missionPhase }),
    reason: input.reason,
  };
}

function buildAudioEventId(cueId: AudioCueId, room: CommanderShellRoomId, createdAt: string): string {
  return `audio:${room}:${cueId}:${createdAt}`;
}
