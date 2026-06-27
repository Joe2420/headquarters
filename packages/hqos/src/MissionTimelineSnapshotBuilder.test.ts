import { describe, expect, it } from 'vitest';
import type { MissionStateChangedEvent } from './MissionEventReader';
import { MissionTimelineBuilder } from './MissionTimelineBuilder';
import { MissionTimelineQuery } from './MissionTimelineQuery';
import { MissionTimelineSnapshotBuilder } from './MissionTimelineSnapshotBuilder';

const missionId = '11111111-1111-4111-8111-111111111111';

function createStateChangedEvent(
  id: string,
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
    missionId,
    priority: 'white',
    payload: {
      missionId,
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

function createSnapshotBuilder(events: MissionStateChangedEvent[]): MissionTimelineSnapshotBuilder {
  const timelineBuilder = new MissionTimelineBuilder(new StubMissionEventReader(events));
  return new MissionTimelineSnapshotBuilder(new MissionTimelineQuery(timelineBuilder));
}

describe('MissionTimelineSnapshotBuilder', () => {
  it('builds an immutable empty mission snapshot', () => {
    const snapshot = createSnapshotBuilder([]).buildForMission(missionId);

    expect(snapshot).toMatchObject({
      missionId,
      missionLifetimeMs: 0,
      stateDurationsMs: {
        idle: 0,
        briefing: 0,
        ready: 0,
        observation: 0,
        authorization: 0,
        deployed: 0,
        return_to_base: 0,
        debrief: 0,
        archived: 0,
      },
    });
    expect(snapshot.currentState).toBeUndefined();
    expect(snapshot.latestTransition).toBeUndefined();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.stateDurationsMs)).toBe(true);
  });

  it('builds a single-entry mission snapshot', () => {
    const snapshot = createSnapshotBuilder([
      createStateChangedEvent('event-1', 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
    ]).buildForMission(missionId);

    expect(snapshot).toMatchObject({
      missionId,
      currentState: 'briefing',
      latestTransition: { from: 'idle', to: 'briefing' },
      missionLifetimeMs: 0,
      stateDurationsMs: {
        briefing: 0,
      },
    });
    expect(Object.isFrozen(snapshot.latestTransition)).toBe(true);
  });

  it('builds a deterministic snapshot for multiple transitions', () => {
    const snapshot = createSnapshotBuilder([
      createStateChangedEvent('event-1', 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
      createStateChangedEvent('event-2', 'briefing', 'ready', '2026-06-27T10:03:00.000Z'),
      createStateChangedEvent('event-3', 'ready', 'observation', '2026-06-27T10:10:00.000Z'),
    ]).buildForMission(missionId);

    expect(snapshot).toEqual({
      missionId,
      currentState: 'observation',
      latestTransition: { from: 'ready', to: 'observation' },
      missionLifetimeMs: 600000,
      stateDurationsMs: {
        idle: 0,
        briefing: 180000,
        ready: 420000,
        observation: 0,
        authorization: 0,
        deployed: 0,
        return_to_base: 0,
        debrief: 0,
        archived: 0,
      },
    });
  });

  it('rejects mutation of frozen snapshot data', () => {
    const snapshot = createSnapshotBuilder([
      createStateChangedEvent('event-1', 'idle', 'briefing', '2026-06-27T10:00:00.000Z'),
    ]).buildForMission(missionId);

    expect(() => {
      (snapshot as { currentState: string }).currentState = 'ready';
    }).toThrow(TypeError);
    expect(() => {
      (snapshot.stateDurationsMs as { briefing: number }).briefing = 1;
    }).toThrow(TypeError);
  });
});
