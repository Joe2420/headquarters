import type { Mission, MissionState } from '@headquarters/shared';

export class MissionKernel {
  createMission(codename: string): Mission {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      codename,
      state: 'created',
      createdAt: now,
      updatedAt: now,
    };
  }

  transition(mission: Mission, nextState: MissionState): Mission {
    return {
      ...mission,
      state: nextState,
      updatedAt: new Date().toISOString(),
    };
  }
}
