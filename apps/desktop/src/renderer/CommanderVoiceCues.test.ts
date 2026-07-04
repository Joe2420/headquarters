import { describe, expect, it } from 'vitest';
import {
  buildCommanderVoiceAudioEvent,
  getCommanderVoiceCueForMessage,
  resolveCommanderVoiceCue,
} from './CommanderVoiceCues';
import type { CommanderMessageType } from './CommanderMessage';

describe('CommanderVoiceCues', () => {
  it('maps every Commander message type to a deterministic future voice cue', () => {
    const messageTypes: readonly CommanderMessageType[] = [
      'briefing',
      'guidance',
      'warning',
      'acknowledgement',
      'transition',
      'debrief',
      'recognition',
      'interruption',
    ];

    expect(messageTypes.map((type) => resolveCommanderVoiceCue(type, 'command'))).toEqual([
      'commander_briefing_ready_room',
      'commander_guidance_general',
      'commander_warning_guardian',
      'commander_acknowledgement_progress',
      'commander_transition_war_room',
      'commander_debrief_complete',
      'commander_recognition_discipline',
      'commander_interruption',
    ]);
  });

  it('uses room-specific voice cues where available', () => {
    expect(resolveCommanderVoiceCue('briefing', 'ready-room')).toBe('commander_briefing_ready_room');
    expect(resolveCommanderVoiceCue('warning', 'guardian')).toBe('commander_warning_guardian');
    expect(resolveCommanderVoiceCue('transition', 'war-room')).toBe('commander_transition_war_room');
  });

  it('falls back safely for unknown or missing cue mappings', () => {
    expect(resolveCommanderVoiceCue('unknown-message-type', 'command')).toBe('commander_guidance_general');
  });

  it('can build a silent Commander voice event candidate without playback side effects', () => {
    const event = buildCommanderVoiceAudioEvent({
      id: 'commander:transition:war-room',
      type: 'transition',
      room: 'war-room',
      priority: 'high',
    });

    expect(event.cueId).toBe('commander_transition_war_room');
    expect(event.channel).toBe('commander');
    expect(event.priority).toBe('high');
  });

  it('reads a cue from an existing Commander message shape', () => {
    expect(getCommanderVoiceCueForMessage({
      type: 'debrief',
      room: 'debrief',
    })).toBe('commander_debrief_complete');
  });
});
