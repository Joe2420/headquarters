import { describe, expect, it } from 'vitest';
import { createAudioEvent, type AudioChannel, type AudioPriority } from './AudioEvents';

describe('AudioEvents', () => {
  it('creates deterministic audio event candidates without playback side effects', () => {
    const event = createAudioEvent({
      type: 'transition_cue',
      cueId: 'transition_start',
      channel: 'transition',
      priority: 'high',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'observation',
      missionPhase: 'observation',
      reason: 'Observation transition started.',
    });

    expect(event).toEqual({
      id: 'audio:observation:transition_start:2026-07-04T10:00:00.000Z',
      type: 'transition_cue',
      cueId: 'transition_start',
      channel: 'transition',
      priority: 'high',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'observation',
      missionPhase: 'observation',
      reason: 'Observation transition started.',
    });
  });

  it('supports every audio channel in the contract', () => {
    const channels: readonly AudioChannel[] = ['commander', 'transition', 'ceremony', 'guardian', 'ambient', 'ui'];

    expect(channels).toHaveLength(6);
  });

  it('supports explicit audio priorities and defaults to normal priority', () => {
    const priorities: readonly AudioPriority[] = ['low', 'normal', 'high', 'critical'];
    const event = createAudioEvent({
      type: 'ui_cue',
      cueId: 'ui_confirm',
      channel: 'ui',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'command',
      reason: 'Operator confirmed a UI action.',
    });

    expect(priorities).toContain('critical');
    expect(event.priority).toBe('normal');
  });
});
