import type { Mission, MissionState } from '@headquarters/shared';
import { describe, expect, it } from 'vitest';
import {
  getAvailableRooms,
  getCompletedLifecycleStages,
  getCurrentLifecycleStage,
  getLifecycleBlockers,
  getPrimaryLifecycleAction,
  getRecommendedRoom,
  isMissionActive,
  isMissionComplete,
  projectMissionLifecycle,
} from './MissionLifecycleProjection';

function mission(state: MissionState): Mission {
  return {
    id: `mission-${state}`,
    codename: 'Foundation Patrol',
    state,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('MissionLifecycleProjection', () => {
  it('starts at mission creation when no mission is active', () => {
    const projection = projectMissionLifecycle();

    expect(projection.activeStage).toBe('missionCreation');
    expect(projection.recommendedRoom).toBe('mission-room');
    expect(projection.currentPrimaryAction.id).toBe('create-mission');
    expect(projection.availableRooms).toEqual(['command-center', 'mission-room']);
    expect(projection.missionActive).toBe(false);
    expect(projection.missionComplete).toBe(false);
  });

  it.each([
    ['idle', 'missionCreation', 'mission-room', []],
    ['briefing', 'briefing', 'ready-room', ['missionCreation']],
    ['ready', 'observation', 'observation-room', ['missionCreation', 'briefing']],
    ['observation', 'observation', 'observation-room', ['missionCreation', 'briefing']],
    ['authorization', 'authorization', 'war-room', ['missionCreation', 'briefing', 'observation']],
    ['deployed', 'deployed', 'war-room', ['missionCreation', 'briefing', 'observation', 'authorization']],
    ['return_to_base', 'returnToBase', 'debrief-theater', ['missionCreation', 'briefing', 'observation', 'authorization', 'deployed']],
    ['debrief', 'debrief', 'debrief-theater', ['missionCreation', 'briefing', 'observation', 'authorization', 'deployed', 'returnToBase']],
  ] as const)('maps %s to the authoritative lifecycle projection', (state, stage, room, completedStages) => {
    const currentMission = mission(state);

    expect(getCurrentLifecycleStage(currentMission)).toBe(stage);
    expect(getRecommendedRoom(currentMission)).toBe(room);
    expect(getCompletedLifecycleStages(currentMission)).toEqual(completedStages);
    expect(getAvailableRooms(currentMission)).toContain(room);
    expect(getLifecycleBlockers(currentMission)).toHaveLength(1);
    expect(isMissionActive(currentMission)).toBe(true);
    expect(isMissionComplete(currentMission)).toBe(false);
  });

  it('keeps deployed missions in the War Room and return-to-base missions in Debrief Theater', () => {
    expect(getPrimaryLifecycleAction(mission('deployed'))).toMatchObject({
      id: 'return-to-base',
      room: 'war-room',
    });
    expect(getPrimaryLifecycleAction(mission('return_to_base'))).toMatchObject({
      id: 'enter-debrief',
      room: 'debrief-theater',
    });
  });

  it('marks archived missions complete and clears normal active mission semantics', () => {
    const archivedMission = mission('archived');
    const projection = projectMissionLifecycle(archivedMission);

    expect(projection.activeStage).toBe('archived');
    expect(projection.recommendedRoom).toBe('archive');
    expect(projection.completedStages).toEqual([
      'missionCreation',
      'briefing',
      'observation',
      'authorization',
      'deployed',
      'returnToBase',
      'debrief',
      'archived',
    ]);
    expect(projection.currentPrimaryAction.id).toBe('create-next-mission');
    expect(projection.blockedActions).toEqual([]);
    expect(projection.missionCompletionState).toBe('complete');
    expect(isMissionActive(archivedMission)).toBe(false);
    expect(isMissionComplete(archivedMission)).toBe(true);
  });

  it('is deterministic for repeated selector calls', () => {
    const activeMission = mission('authorization');

    expect(projectMissionLifecycle(activeMission)).toEqual(projectMissionLifecycle(activeMission));
    expect(getAvailableRooms(activeMission)).toEqual(getAvailableRooms(activeMission));
  });
});
