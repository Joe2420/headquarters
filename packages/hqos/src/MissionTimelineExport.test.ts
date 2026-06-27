import { describe, expect, it } from 'vitest';
import type { MissionStateDurationMs, MissionTimeline } from './MissionTimelineBuilder';
import {
  MISSION_TIMELINE_DURATION_MODEL,
  MISSION_TIMELINE_FINAL_STATE_DURATION_MS,
  serializeMissionTimeline,
} from './MissionTimelineExport';

const missionId = '11111111-1111-4111-8111-111111111111';

function zeroStateDurations(overrides: Partial<MissionStateDurationMs> = {}): MissionStateDurationMs {
  return {
    idle: 0,
    briefing: 0,
    ready: 0,
    observation: 0,
    authorization: 0,
    deployed: 0,
    return_to_base: 0,
    debrief: 0,
    archived: 0,
    ...overrides,
  };
}

describe('MissionTimelineExport', () => {
  it('serializes an empty timeline with deterministic duration metadata', () => {
    const timeline: MissionTimeline = {
      missionId,
      entries: [],
      transitions: [],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
      },
    };

    expect(serializeMissionTimeline(timeline)).toEqual({
      missionId,
      entries: [],
      transitions: [],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
        durationModel: MISSION_TIMELINE_DURATION_MODEL,
        finalStateDurationMs: MISSION_TIMELINE_FINAL_STATE_DURATION_MS,
      },
    });
  });

  it('serializes a single-entry timeline with final-state duration documented as zero', () => {
    const timeline: MissionTimeline = {
      missionId,
      entries: [
        {
          eventId: 'event-1',
          missionId,
          occurredAt: '2026-06-27T10:00:00.000Z',
          transition: { from: 'idle', to: 'briefing' },
          reason: 'mission opened',
        },
      ],
      transitions: [{ from: 'idle', to: 'briefing' }],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
      },
    };

    expect(serializeMissionTimeline(timeline)).toEqual({
      missionId,
      entries: [
        {
          eventId: 'event-1',
          missionId,
          occurredAt: '2026-06-27T10:00:00.000Z',
          transition: { from: 'idle', to: 'briefing' },
          reason: 'mission opened',
        },
      ],
      transitions: [{ from: 'idle', to: 'briefing' }],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
        durationModel: MISSION_TIMELINE_DURATION_MODEL,
        finalStateDurationMs: 0,
      },
    });
  });

  it('preserves timeline entry and transition order with duration data', () => {
    const timeline: MissionTimeline = {
      missionId,
      entries: [
        {
          eventId: 'event-1',
          missionId,
          occurredAt: '2026-06-27T10:00:00.000Z',
          transition: { from: 'idle', to: 'briefing' },
        },
        {
          eventId: 'event-2',
          missionId,
          occurredAt: '2026-06-27T10:05:00.000Z',
          transition: { from: 'briefing', to: 'ready' },
        },
      ],
      transitions: [
        { from: 'idle', to: 'briefing' },
        { from: 'briefing', to: 'ready' },
      ],
      durations: {
        byStateMs: zeroStateDurations({ briefing: 300000 }),
        lifetimeMs: 300000,
      },
    };

    const exported = serializeMissionTimeline(timeline);

    expect(exported.entries.map((entry) => entry.eventId)).toEqual(['event-1', 'event-2']);
    expect(exported.transitions).toEqual([
      { from: 'idle', to: 'briefing' },
      { from: 'briefing', to: 'ready' },
    ]);
    expect(exported.durations).toEqual({
      byStateMs: zeroStateDurations({ briefing: 300000 }),
      lifetimeMs: 300000,
      durationModel: MISSION_TIMELINE_DURATION_MODEL,
      finalStateDurationMs: 0,
    });
  });

  it('returns a DTO copy instead of exposing internal timeline object references', () => {
    const timeline: MissionTimeline = {
      entries: [
        {
          eventId: 'event-1',
          missionId,
          occurredAt: '2026-06-27T10:00:00.000Z',
          transition: { from: 'idle', to: 'briefing' },
        },
      ],
      transitions: [{ from: 'idle', to: 'briefing' }],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
      },
    };

    const exported = serializeMissionTimeline(timeline);

    expect(exported).not.toBe(timeline);
    expect(exported.entries).not.toBe(timeline.entries);
    expect(exported.entries[0]).not.toBe(timeline.entries[0]);
    expect(exported.entries[0]?.transition).not.toBe(timeline.entries[0]?.transition);
    expect(exported.transitions).not.toBe(timeline.transitions);
    expect(exported.transitions[0]).not.toBe(timeline.transitions[0]);
    expect(exported.durations.byStateMs).not.toBe(timeline.durations.byStateMs);
  });
});
