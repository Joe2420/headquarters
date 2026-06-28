import { EventBus } from './EventBus';
import { ServiceRegistry, type RegisteredHQOSService } from './ServiceRegistry';
import { createEventEnvelope } from './events';

export type HQOSBootState = 'idle' | 'booting' | 'ready' | 'failed';
export type HQOSServiceBootStatus = 'ready' | 'failed' | 'degraded';

export interface HQOSServiceBootResult {
  serviceId: string;
  required: boolean;
  status: HQOSServiceBootStatus;
  error?: string;
}

export interface HQOSBootResult {
  ok: boolean;
  state: HQOSBootState;
  services: readonly HQOSServiceBootResult[];
  error?: string;
}

export interface HQOSKernelOptions {
  eventBus?: EventBus;
  serviceRegistry?: ServiceRegistry;
  source?: string;
}

export class HQOSKernel {
  readonly events: EventBus;
  readonly services: ServiceRegistry;

  private readonly source: string;
  private bootState: HQOSBootState = 'idle';

  constructor(options: HQOSKernelOptions = {}) {
    this.events = options.eventBus ?? new EventBus();
    this.services = options.serviceRegistry ?? new ServiceRegistry();
    this.source = options.source ?? 'HQOSKernel';
  }

  get state(): HQOSBootState {
    return this.bootState;
  }

  async boot(): Promise<HQOSBootResult> {
    this.bootState = 'booting';

    await this.events.publish(createEventEnvelope({
      type: 'system.boot.started',
      source: this.source,
      payload: {
        bootMode: 'normal',
      },
    }));

    const serviceResults = await this.initializeServices(this.services.list());
    const blockingFailure = serviceResults.find((result) => result.required && result.status === 'failed');

    if (blockingFailure) {
      this.bootState = 'failed';
      const error = blockingFailure.error ?? `Required service failed: ${blockingFailure.serviceId}`;

      return {
        ok: false,
        state: this.bootState,
        services: serviceResults,
        error,
      };
    }

    this.bootState = 'ready';

    await this.events.publish(createEventEnvelope({
      type: 'system.boot.completed',
      source: this.source,
      payload: {
        bootMode: 'normal',
        integrityStatus: serviceResults.some((result) => result.status === 'degraded') ? 'degraded' : 'secure',
      },
    }));

    return {
      ok: true,
      state: this.bootState,
      services: serviceResults,
    };
  }

  private async initializeServices(services: readonly RegisteredHQOSService[]): Promise<HQOSServiceBootResult[]> {
    const results: HQOSServiceBootResult[] = [];

    for (const service of services) {
      try {
        await service.initialize?.();

        results.push({
          serviceId: service.id,
          required: service.required,
          status: 'ready',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown service initialization failure';

        results.push({
          serviceId: service.id,
          required: service.required,
          status: service.required ? 'failed' : 'degraded',
          error: message,
        });

        if (service.required) {
          break;
        }
      }
    }

    return results;
  }
}
