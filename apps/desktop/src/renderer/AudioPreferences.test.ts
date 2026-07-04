import { describe, expect, it } from 'vitest';
import { createAudioEvent } from './AudioEvents';
import {
  applyReducedAudio,
  defaultAudioPreferences,
  describeAudioPreferenceState,
  isAudioChannelEnabled,
  muteAllAudioPreferences,
  shouldPlayAudioEvent,
} from './AudioPreferences';

describe('AudioPreferences', () => {
  it('uses conservative default preferences', () => {
    expect(defaultAudioPreferences).toEqual({
      audioEnabled: true,
      commanderVoiceEnabled: false,
      transitionAudioEnabled: true,
      ceremonyAudioEnabled: true,
      guardianAudioEnabled: true,
      ambientAudioEnabled: false,
      reducedAudio: true,
    });
    expect(describeAudioPreferenceState(defaultAudioPreferences)).toBe('Reduced audio');
  });

  it('supports mute all behavior', () => {
    const muted = muteAllAudioPreferences();

    expect(muted.audioEnabled).toBe(false);
    expect(isAudioChannelEnabled('transition', muted)).toBe(false);
    expect(describeAudioPreferenceState(muted)).toBe('Audio muted');
  });

  it('applies reduced audio by disabling ambient and low-priority cues', () => {
    const reduced = applyReducedAudio({
      ...defaultAudioPreferences,
      ambientAudioEnabled: true,
      reducedAudio: false,
    });
    const lowEvent = createAudioEvent({
      type: 'transition_cue',
      cueId: 'transition_door_lock',
      channel: 'transition',
      priority: 'low',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'observation',
      reason: 'Reduced audio test.',
    });
    const criticalEvent = createAudioEvent({
      type: 'guardian_alert',
      cueId: 'guardian_alert_lockout',
      channel: 'guardian',
      priority: 'critical',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'guardian',
      reason: 'Critical audio test.',
    });

    expect(reduced.ambientAudioEnabled).toBe(false);
    expect(shouldPlayAudioEvent(lowEvent, reduced)).toBe(false);
    expect(shouldPlayAudioEvent(criticalEvent, reduced)).toBe(true);
  });

  it('honors category-specific disabled behavior', () => {
    const event = createAudioEvent({
      type: 'commander_voice',
      cueId: 'commander_guidance_general',
      channel: 'commander',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'command',
      reason: 'Commander disabled test.',
    });

    expect(shouldPlayAudioEvent(event, defaultAudioPreferences)).toBe(false);
    expect(shouldPlayAudioEvent(event, {
      ...defaultAudioPreferences,
      commanderVoiceEnabled: true,
      reducedAudio: false,
    })).toBe(true);
  });
});
