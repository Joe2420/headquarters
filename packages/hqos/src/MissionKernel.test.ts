import { describe, expect, it } from 'vitest';
import type { MissionState } from '@headquarters/shared';
import {
  InvalidMissionTransitionError,
  MissionKernel,
  MISSION_STATES,
  MISSION_TRANSITIONS,
} from './MissionKernel';

const occurredAt = '2026-06-27T08:00:00.000Z';

describe('MissionKernel', () => {
  it('defines the strict MVP mission states and transitions', () => {
    expect(MISSION_STATES).toEqual([
      'idle',
      'briefing',
      'ready',
      'observation',
      'authorization',
      'deployed',
      'return_to_base',
      'debrief',
      'archived',
    ]);

    expect(MISSION_TRANSITIONS).toEqual({
      idle: ['briefing'],
      briefing: ['ready'],
      ready: ['observation'],
      observation: ['authorization'],
      authorization: ['deployed'],
      deployed: ['return_to_base'],
      return_to_base: ['debrief'],
      debrief: ['archived'],
      archived: [],
    });
  });

  it('moves through the normal mission lifecycle and emits state change events', () => {
    const kernel = new MissionKernel();
    let mission = kernel.createMission('Quiet Lifecycle');
    const flow: MissionState[] = [
      'briefing',
      'ready',
      'observation',
      'authorization',
      'deployed',
      'return_to_base',
      'debrief',
      'archived',
    ];

    expect(mission.state).toBe('idle');

    for (const nextState of flow) {
      const previousState = mission.state;
      const result = kernel.transition(mission, nextState, {
        occurredAt,
        reason: `advance to ${nextState}`,
      });

      mission = result.mission;

      expect(mission.state).toBe(nextState);
      expect(mission.updatedAt).toBe(occurredAt);
      expect(result.event.type).toBe('mission.state.changed');
      expect(result.event.source).toBe('MissionKernel');
      expect(result.event.missionId).toBe(mission.id);
      expect(result.event.payload).toEqual({
        missionId: mission.id,
        from: previousState,
        to: nextState,
        reason: `advance to ${nextState}`,
      });
    }

    expect(mission.state).toBe('archived');
  });

  it('rejects invalid mission transitions without changing the mission', () => {
    const kernel = new MissionKernel();
    const mission = kernel.createMission('Strict Gate');

    expect(() => kernel.transition(mission, 'deployed')).toThrow(InvalidMissionTransitionError);
    expect(mission.state).toBe('idle');
  });

  it('rejects transitions from archived missions', () => {
    const kernel = new MissionKernel();
    const mission = {
      ...kernel.createMission('Finished Work'),
      state: 'archived' as const,
    };

    expect(kernel.getAllowedTransitions('archived')).toEqual([]);
    expect(() => kernel.transition(mission, 'debrief')).toThrow(
      'Invalid mission transition for',
    );
  });
});
