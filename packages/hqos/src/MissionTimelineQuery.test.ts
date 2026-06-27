import { describe, expect, it } from 'vitest';
import type { MissionStateChangedEvent } from './MissionEventReader';
import { MissionTimelineBuilder } from './MissionTimelineBuilder';
import { MissionTimelineQuery } from './MissionTimelineQuery';

const missionId = '11111111-1111-4111-8111-111111111111';
const otherMissionId = '22222222-2222-4222-8222-222222222222';

function createStateChangedEvent(
  id: string,
  targetMissionId: string,
  from: MissionStateChangedEvent['payload']['from'],
  to: MissionStateChangedEvent['payload']['to'],
  occurredAt: string,
): MissionStateChangedEvent {
  return {
    id,
    type: 'mission.state.changed',
    version: 1,
    occurredAt,
    source: 'MissionKernel',
    missionId: targetMissionId,
    priority: 'white',
    payload: {
      missionId: targetMissionId,
      from,
      to,
    },
  };
}

class StubMissionEventReader {
  constructor(private readonly events: MissionStateChangedEvent[]) {}

  listStateChanges(): MissionStateChangedEvent[] {
    return this.events;
  }

  listStateChangesForMission(targetMissionId: string): MissionStateChangedEvent[] {
    return this.events.filter((event) => event.payload.missionId === targetMissionId);
  }
}

function createQuery(events: MissionStateChangedEvent[]): MissionTimelineQuery {
  return new MissionTimelineQuery(new MissionTimelineBuilder(new StubMissionEventReader(events)));
}

describe('MissionTimelineQuery', () => {
  it('returns an empty timeline and empty query values for missions without events', () => {
    const query = createQuery([]);

    expect(query.getTimelineByMissionId(missionId)).toMatchObject({
      missionId,
      entries: [],
      transitions: [],
      durations: {
        lifetimeMs: 0,
      },
    });
    expect(query.getLatestMissionState(missionId)).toBeUndefined();
    expect(query.getLatestTransition(missionId)).toBeUndefined();
    expect(query.getMissionLifetimeMs(missionId)).toBe(0);
    expect(query.getDurationForStateMs(missionId, 'briefing')).toBe(0);
  });

  it('preserves timeline ordering when retrieving by mission id', () => {
    const query = createQuery([
      createStateChangedEvent('event-1', missionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
      createStateChangedEvent('event-2', otherMissionId, 'idle', 'briefing', '2026-06-27T10:01:00.000Z'),
      createStateChangedEvent('event-3', missionId, 'briefing', 'ready', '2026-06-27T10:02:00.000Z'),
    ]);

    expect(query.getTimelineByMissionId(missionId).entries.map((entry) => entry.eventId)).toEqual([
      'event-1',
      'event-3',
    ]);
  });

  it('retrieves the latest mission state and latest transition', () => {
    const query = createQuery([
      createStateChangedEvent('event-1', missionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
      createStateChangedEvent('event-2', missionId, 'briefing', 'ready', '2026-06-27T10:05:00.000Z'),
      createStateChangedEvent('event-3', missionId, 'ready', 'observation', '2026-06-27T10:10:00.000Z'),
    ]);

    expect(query.getLatestMissionState(missionId)).toBe('observation');
    expect(query.getLatestTransition(missionId)).toEqual({ from: 'ready', to: 'observation' });
  });

  it('retrieves mission lifetime and duration per state', () => {
    const query = createQuery([
      createStateChangedEvent('event-1', missionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
      createStateChangedEvent('event-2', missionId, 'briefing', 'ready', '2026-06-27T10:03:00.000Z'),
      createStateChangedEvent('event-3', missionId, 'ready', 'observation', '2026-06-27T10:10:00.000Z'),
    ]);

    expect(query.getMissionLifetimeMs(missionId)).toBe(600000);
    expect(query.getDurationForStateMs(missionId, 'briefing')).toBe(180000);
    expect(query.getDurationForStateMs(missionId, 'ready')).toBe(420000);
    expect(query.getDurationsByStateMs(missionId)).toMatchObject({
      briefing: 180000,
      ready: 420000,
      observation: 0,
    });
  });

  it('returns a copy of state durations', () => {
    const query = createQuery([
      createStateChangedEvent('event-1', missionId, 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
    ]);
    const timeline = query.getTimelineByMissionId(missionId);

    expect(query.getDurationsByStateMs(missionId)).not.toBe(timeline.durations.byStateMs);
  });
});
