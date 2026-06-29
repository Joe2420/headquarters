import { describe, expect, it } from 'vitest';
import type { MissionStateChangedEvent } from './MissionEventReader';
import { MissionKernel } from './MissionKernel';
import { MissionTimelineBuilder } from './MissionTimelineBuilder';

const missionId = '11111111-1111-4111-8111-111111111111';

class ReviewEventReader {
  constructor(private readonly events: MissionStateChangedEvent[]) {}

  listStateChanges(): MissionStateChangedEvent[] {
    return this.events;
  }

  listStateChangesForMission(requestedMissionId: string): MissionStateChangedEvent[] {
    return this.events.filter((event) => event.payload.missionId === requestedMissionId);
  }
}

describe('Sprint 2 mission lifecycle review', () => {
  it('reconstructs the mission lifecycle trace from state-change events', () => {
    const kernel = new MissionKernel();
    let mission = {
      ...kernel.createMission('Sprint 2 Review Mission'),
      id: missionId,
      createdAt: '2026-06-28T20:00:00.000Z',
      updatedAt: '2026-06-28T20:00:00.000Z',
    };
    const events: MissionStateChangedEvent[] = [];

    for (const step of [
      { state: 'briefing' as const, occurredAt: '2026-06-28T20:01:00.000Z' },
      { state: 'ready' as const, occurredAt: '2026-06-28T20:03:00.000Z' },
      { state: 'observation' as const, occurredAt: '2026-06-28T20:05:00.000Z' },
      { state: 'authorization' as const, occurredAt: '2026-06-28T20:10:00.000Z' },
      { state: 'deployed' as const, occurredAt: '2026-06-28T20:12:00.000Z' },
      { state: 'return_to_base' as const, occurredAt: '2026-06-28T20:20:00.000Z' },
      { state: 'debrief' as const, occurredAt: '2026-06-28T20:25:00.000Z' },
      { state: 'archived' as const, occurredAt: '2026-06-28T20:30:00.000Z' },
    ]) {
      const transition = kernel.transition(mission, step.state, { occurredAt: step.occurredAt });
      mission = transition.mission;
      events.push(transition.event);
    }

    const timeline = new MissionTimelineBuilder(new ReviewEventReader(events)).buildForMission(missionId);

    expect(mission.state).toBe('archived');
    expect(timeline.transitions).toEqual([
      { from: 'idle', to: 'briefing' },
      { from: 'briefing', to: 'ready' },
      { from: 'ready', to: 'observation' },
      { from: 'observation', to: 'authorization' },
      { from: 'authorization', to: 'deployed' },
      { from: 'deployed', to: 'return_to_base' },
      { from: 'return_to_base', to: 'debrief' },
      { from: 'debrief', to: 'archived' },
    ]);
    expect(timeline.entries).toHaveLength(8);
    expect(timeline.durations.lifetimeMs).toBe(1740000);
  });
});
