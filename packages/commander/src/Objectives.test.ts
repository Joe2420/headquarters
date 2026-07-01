import { describe, expect, it } from 'vitest';
import { buildCommanderObjectives } from './Objectives';

describe('buildCommanderObjectives', () => {
  it('represents an active mission objective deterministically', () => {
    const objectives = buildCommanderObjectives({
      activeMissionId: 'mission-001',
      activeMissionTitle: 'Foundation Patrol',
      activeMissionObjective: 'Protect process quality',
      generatedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(objectives.summary).toBe('Active objective is tied to Foundation Patrol.');
    expect(objectives.objectives).toEqual([{
      id: 'mission-001:objective',
      scope: 'mission',
      title: 'Protect process quality',
      status: 'active',
    }]);
    expect(objectives.constraints).toContain('No social mechanics.');
    expect(objectives.constraints).toContain('No gamified scoring.');
  });

  it('handles missing objective context safely', () => {
    const objectives = buildCommanderObjectives({
      generatedAt: 'standby',
    });

    expect(objectives.summary).toBe('No mission objective is ready for Commander display.');
    expect(objectives.objectives).toEqual([]);
  });
});
