import { describe, expect, it } from 'vitest';
import type { MissionStateChangedEvent } from './MissionEventReader';
import type { MissionStateDurationMs } from './MissionTimelineBuilder';
import { MissionTimelineBuilder } from './MissionTimelineBuilder';

const firstMissionId = '11111111-1111-4111-8111-111111111111';
const secondMissionId = '22222222-2222-4222-8222-222222222222';

function createStateChangedEvent(
  id: string,
  missionId: string,
  from: MissionStateChangedEvent['payload']['from'],
  to: MissionStateChangedEvent['payload']['to'],
  occurredAt: string,
  reason?: string,
): MissionStateChangedEvent {
  return {
    id,
    type: 'mission.state.changed',
    version: 1,
    occurredAt,
    source: 'MissionKernel',
    missionId,
    priority: 'white',
    payload: {
      missionId,
      from,
      to,
      ...(reason !== undefined ? { reason } : {}),
    },
  };
}

class StubMissionEventReader {
  constructor(private readonly events: MissionStateChangedEvent[]) {}

  listStateChanges(): MissionStateChangedEvent[] {
    return this.events;
  }

  listStateChangesForMission(missionId: string): MissionStateChangedEvent[] {
    return this.events.filter((event) => event.payload.missionId === missionId);
  }
}

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

describe('MissionTimelineBuilder', () => {
  it('builds ordered timeline entries and transitions from mission events', () => {
    const events = [
      createStateChangedEvent('event-1', firstMissionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z', 'start'),
      createStateChangedEvent('event-2', firstMissionId, 'briefing', 'ready', '2026-06-27T10:05:00.000Z'),
      createStateChangedEvent('event-3', firstMissionId, 'ready', 'observation', '2026-06-27T10:10:00.000Z'),
    ];
    const builder = new MissionTimelineBuilder(new StubMissionEventReader(events));

    expect(builder.buildAll()).toEqual({
      entries: [
        {
          eventId: 'event-1',
          missionId: firstMissionId,
          occurredAt: '2026-06-27T10:00:00.000Z',
          transition: { from: 'idle', to: 'briefing' },
          reason: 'start',
        },
        {
          eventId: 'event-2',
          missionId: firstMissionId,
          occurredAt: '2026-06-27T10:05:00.000Z',
          transition: { from: 'briefing', to: 'ready' },
        },
        {
          eventId: 'event-3',
          missionId: firstMissionId,
          occurredAt: '2026-06-27T10:10:00.000Z',
          transition: { from: 'ready', to: 'observation' },
        },
      ],
      transitions: [
        { from: 'idle', to: 'briefing' },
        { from: 'briefing', to: 'ready' },
        { from: 'ready', to: 'observation' },
      ],
      durations: {
        byStateMs: zeroStateDurations({
          briefing: 300000,
          ready: 300000,
        }),
        lifetimeMs: 600000,
      },
    });
  });

  it('builds a timeline for one mission id without reordering events', () => {
    const events = [
      createStateChangedEvent('event-1', firstMissionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
      createStateChangedEvent('event-2', secondMissionId, 'idle', 'briefing', '2026-06-27T10:01:00.000Z'),
      createStateChangedEvent('event-3', firstMissionId, 'briefing', 'ready', '2026-06-27T10:02:00.000Z'),
    ];
    const builder = new MissionTimelineBuilder(new StubMissionEventReader(events));

    expect(builder.buildForMission(firstMissionId)).toEqual({
      missionId: firstMissionId,
      entries: [
        {
          eventId: 'event-1',
          missionId: firstMissionId,
          occurredAt: '2026-06-27T10:00:00.000Z',
          transition: { from: 'idle', to: 'briefing' },
        },
        {
          eventId: 'event-3',
          missionId: firstMissionId,
          occurredAt: '2026-06-27T10:02:00.000Z',
          transition: { from: 'briefing', to: 'ready' },
        },
      ],
      transitions: [
        { from: 'idle', to: 'briefing' },
        { from: 'briefing', to: 'ready' },
      ],
      durations: {
        byStateMs: zeroStateDurations({
          briefing: 120000,
        }),
        lifetimeMs: 120000,
      },
    });
  });

  it('returns an empty timeline when no mission events exist', () => {
    const builder = new MissionTimelineBuilder(new StubMissionEventReader([]));

    expect(builder.buildAll()).toEqual({
      entries: [],
      transitions: [],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
      },
    });
    expect(builder.buildForMission(firstMissionId)).toEqual({
      missionId: firstMissionId,
      entries: [],
      transitions: [],
      durations: {
        byStateMs: zeroStateDurations(),
        lifetimeMs: 0,
      },
    });
  });

  it('returns zero durations for a single-event timeline', () => {
    const events = [
      createStateChangedEvent('event-1', firstMissionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
    ];
    const builder = new MissionTimelineBuilder(new StubMissionEventReader(events));

    expect(builder.buildForMission(firstMissionId).durations).toEqual({
      byStateMs: zeroStateDurations(),
      lifetimeMs: 0,
    });
  });

  it('calculates state durations across multiple transitions deterministically', () => {
    const events = [
      createStateChangedEvent('event-1', firstMissionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
      createStateChangedEvent('event-2', firstMissionId, 'briefing', 'ready', '2026-06-27T10:03:00.000Z'),
      createStateChangedEvent('event-3', firstMissionId, 'ready', 'observation', '2026-06-27T10:10:00.000Z'),
      createStateChangedEvent('event-4', firstMissionId, 'observation', 'debrief', '2026-06-27T10:25:00.000Z'),
    ];
    const builder = new MissionTimelineBuilder(new StubMissionEventReader(events));
    const timeline = builder.buildForMission(firstMissionId);

    expect(timeline.entries.map((entry) => entry.eventId)).toEqual(['event-1', 'event-2', 'event-3', 'event-4']);
    expect(timeline.durations).toEqual({
      byStateMs: zeroStateDurations({
        briefing: 180000,
        ready: 420000,
        observation: 900000,
      }),
      lifetimeMs: 1500000,
    });
  });
});
