import { describe, expect, it } from 'vitest';
import { HQOSKernel } from './HQOSKernel';

describe('HQOSKernel', () => {
  it('initializes registered services in order and publishes boot events', async () => {
    const initialized: string[] = [];
    const kernel = new HQOSKernel();

    kernel.services.register({
      id: 'DatabaseService',
      initialize: () => {
        initialized.push('DatabaseService');
      },
    });
    kernel.services.register({
      id: 'EventBusService',
      initialize: () => {
        initialized.push('EventBusService');
      },
    });

    const result = await kernel.boot();

    expect(result.ok).toBe(true);
    expect(result.state).toBe('ready');
    expect(initialized).toEqual(['DatabaseService', 'EventBusService']);
    expect(kernel.events.getHistory().map((event) => event.type)).toEqual([
      'system.boot.started',
      'system.boot.completed',
    ]);
  });

  it('fails safely when a required service fails', async () => {
    const kernel = new HQOSKernel();

    kernel.services.register({
      id: 'DatabaseService',
      initialize: () => {
        throw new Error('database unavailable');
      },
    });
    kernel.services.register({
      id: 'EventBusService',
      initialize: () => undefined,
    });

    const result = await kernel.boot();

    expect(result.ok).toBe(false);
    expect(result.state).toBe('failed');
    expect(result.error).toBe('database unavailable');
    expect(result.services).toEqual([
      {
        serviceId: 'DatabaseService',
        required: true,
        status: 'failed',
        error: 'database unavailable',
      },
    ]);
    expect(kernel.events.getHistory().map((event) => event.type)).toEqual(['system.boot.started']);
  });

  it('degrades safely when an optional service fails', async () => {
    const kernel = new HQOSKernel();

    kernel.services.register({
      id: 'DatabaseService',
      initialize: () => undefined,
    });
    kernel.services.register({
      id: 'RecognitionService',
      required: false,
      initialize: () => {
        throw new Error('optional service offline');
      },
    });

    const result = await kernel.boot();

    expect(result.ok).toBe(true);
    expect(result.state).toBe('ready');
    expect(result.services).toEqual([
      {
        serviceId: 'DatabaseService',
        required: true,
        status: 'ready',
      },
      {
        serviceId: 'RecognitionService',
        required: false,
        status: 'degraded',
        error: 'optional service offline',
      },
    ]);
    expect(kernel.events.getHistoryByType('system.boot.completed')[0]?.payload.integrityStatus).toBe('degraded');
  });
});
