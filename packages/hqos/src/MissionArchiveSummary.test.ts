import { describe, expect, it } from 'vitest';
import type { HQEvent, Mission } from '@headquarters/shared';
import { buildMissionArchiveSummary, MissionArchiveSummaryStateError } from './MissionArchiveSummary';

const missionId = '11111111-1111-4111-8111-111111111111';

describe('MissionArchiveSummary', () => {
  it('builds an archived mission summary from mission events in append order', () => {
    const mission = createMission('archived');
    const events: HQEvent[] = [
      createEvent('mission.created', missionId),
      createEvent('mission.state.changed', missionId),
      createEvent('mission.created', '22222222-2222-4222-8222-222222222222'),
      createEvent('mission.debrief_completed', missionId),
    ];

    expect(buildMissionArchiveSummary(mission, events)).toEqual({
      missionId,
      codename: 'Archived Mission',
      archivedAt: '2026-06-28T20:30:00.000Z',
      eventCount: 3,
      eventTypes: ['mission.created', 'mission.state.changed', 'mission.debrief_completed'],
    });
  });

  it('rejects summary creation for non-archived missions', () => {
    expect(() => buildMissionArchiveSummary(createMission('debrief'), [])).toThrow(MissionArchiveSummaryStateError);
  });
});

function createMission(state: Mission['state']): Mission {
  return {
    id: missionId,
    codename: 'Archived Mission',
    state,
    createdAt: '2026-06-28T19:00:00.000Z',
    updatedAt: '2026-06-28T20:30:00.000Z',
  };
}

function createEvent(type: HQEvent['type'], eventMissionId: string): HQEvent {
  return {
    id: crypto.randomUUID(),
    type,
    version: 1,
    occurredAt: '2026-06-28T20:00:00.000Z',
    source: 'MissionArchiveSummaryTest',
    missionId: eventMissionId,
    priority: 'white',
    payload: {
      missionId: eventMissionId,
    },
  };
}
