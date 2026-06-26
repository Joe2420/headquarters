import { EventBus } from './EventBus';
import { StateStore } from './StateStore';
import { MissionKernel } from './MissionKernel';

export class HQOS {
  readonly events = new EventBus();
  readonly state = new StateStore();
  readonly missions = new MissionKernel();

  async boot(): Promise<void> {
    await this.events.publish({
      id: crypto.randomUUID(),
      type: 'hq.boot.started',
      timestamp: new Date().toISOString(),
      source: 'hqos',
      payload: {},
    });
    this.state.setBooted(true);
    await this.events.publish({
      id: crypto.randomUUID(),
      type: 'hq.boot.completed',
      timestamp: new Date().toISOString(),
      source: 'hqos',
      payload: {},
    });
  }
}
