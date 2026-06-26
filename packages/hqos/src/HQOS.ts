import { EventBus } from './EventBus';
import { StateStore } from './StateStore';
import { MissionKernel } from './MissionKernel';
import { createEventEnvelope } from './events';

export class HQOS {
  readonly events = new EventBus();
  readonly state = new StateStore();
  readonly missions = new MissionKernel();

  async boot(): Promise<void> {
    await this.events.publish(createEventEnvelope({
      type: 'hq.boot.started',
      source: 'hqos',
      payload: {},
    }));

    this.state.setBooted(true);

    await this.events.publish(createEventEnvelope({
      type: 'hq.boot.completed',
      source: 'hqos',
      payload: {},
    }));
  }
}
