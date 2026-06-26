import type { Mission, OperatorSnapshot } from '@headquarters/shared';

export interface HeadquartersState {
  activeMission: Mission | null;
  latestOperatorSnapshot: OperatorSnapshot | null;
  booted: boolean;
}

export class StateStore {
  private state: HeadquartersState = {
    activeMission: null,
    latestOperatorSnapshot: null,
    booted: false,
  };

  getState(): HeadquartersState {
    return structuredClone(this.state);
  }

  setBooted(value: boolean): void {
    this.state.booted = value;
  }

  setActiveMission(mission: Mission | null): void {
    this.state.activeMission = mission;
  }

  setOperatorSnapshot(snapshot: OperatorSnapshot): void {
    this.state.latestOperatorSnapshot = snapshot;
  }
}
