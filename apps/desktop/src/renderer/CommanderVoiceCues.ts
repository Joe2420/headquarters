import type { AudioCueId, AudioEvent } from './AudioEvents';
import { createAudioEvent } from './AudioEvents';
import type { CommanderMessage, CommanderMessageType } from './CommanderMessage';
import type { CommanderShellRoomId } from './CommanderShell';

const voiceCueByType: Record<CommanderMessageType, AudioCueId> = {
  briefing: 'commander_briefing_ready_room',
  guidance: 'commander_guidance_general',
  warning: 'commander_warning_guardian',
  acknowledgement: 'commander_acknowledgement_progress',
  transition: 'commander_transition_war_room',
  debrief: 'commander_debrief_complete',
  recognition: 'commander_recognition_discipline',
  interruption: 'commander_interruption',
};

export function resolveCommanderVoiceCue(
  messageType: CommanderMessageType | string,
  room: CommanderShellRoomId = 'command',
): AudioCueId {
  if (messageType === 'briefing' && room === 'ready-room') return 'commander_briefing_ready_room';
  if (messageType === 'transition' && room === 'war-room') return 'commander_transition_war_room';
  if (messageType === 'warning' && room === 'guardian') return 'commander_warning_guardian';
  if (isCommanderMessageType(messageType)) return voiceCueByType[messageType];
  return 'commander_guidance_general';
}

export function getCommanderVoiceCueForMessage(message: Pick<CommanderMessage, 'type' | 'room'>): AudioCueId {
  return resolveCommanderVoiceCue(message.type, message.room);
}

export function buildCommanderVoiceAudioEvent(
  message: Pick<CommanderMessage, 'id' | 'type' | 'room' | 'priority'>,
  createdAt = '2026-07-04T00:00:00.000Z',
): AudioEvent {
  return createAudioEvent({
    type: 'commander_voice',
    cueId: resolveCommanderVoiceCue(message.type, message.room),
    channel: 'commander',
    priority: message.priority === 'critical' ? 'critical' : message.priority === 'high' ? 'high' : 'normal',
    createdAt,
    room: message.room,
    reason: `Commander voice cue candidate for ${message.id}.`,
  });
}

function isCommanderMessageType(value: string): value is CommanderMessageType {
  return value === 'briefing'
    || value === 'guidance'
    || value === 'warning'
    || value === 'acknowledgement'
    || value === 'transition'
    || value === 'debrief'
    || value === 'recognition'
    || value === 'interruption';
}
