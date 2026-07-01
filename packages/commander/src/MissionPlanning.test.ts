import { describe, expect, it } from 'vitest';
import { buildCommanderMissionPlanning } from './MissionPlanning';

describe('buildCommanderMissionPlanning', () => {
  it('builds mission-linked planning standards without trade signals', () => {
    const planning = buildCommanderMissionPlanning({
      missionId: 'mission-001',
      missionTitle: 'Foundation Patrol',
      objective: 'Protect process quality',
      currentState: 'ready',
      generatedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(planning.summary).toBe('Planning support is linked to Foundation Patrol.');
    expect(planning.missionLinked).toBe(true);
    expect(planning.standards).toContain('Objective: Protect process quality');
    expect(planning.standards).toContain('Current state: ready');
    expect(planning.constraints).toContain('No trade signals.');
    expect(planning.constraints).toContain('No bypass of HQOS mission logic.');
  });

  it('handles missing mission context safely', () => {
    const planning = buildCommanderMissionPlanning({
      generatedAt: 'standby',
    });

    expect(planning.summary).toBe('Planning support is waiting for an approved mission.');
    expect(planning.missionLinked).toBe(false);
    expect(planning.standards).toContain('Objective must be defined in the mission contract.');
  });
});
