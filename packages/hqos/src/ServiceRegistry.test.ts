import { describe, expect, it } from 'vitest';
import { ServiceRegistry } from './ServiceRegistry';

describe('ServiceRegistry', () => {
  it('registers services in initialization order', () => {
    const registry = new ServiceRegistry();

    registry.register({ id: 'DatabaseService' });
    registry.register({ id: 'MigrationService', required: false });

    expect(registry.list().map((service) => service.id)).toEqual(['DatabaseService', 'MigrationService']);
    expect(registry.get('MigrationService')?.required).toBe(false);
  });

  it('rejects duplicate service ids', () => {
    const registry = new ServiceRegistry();
    registry.register({ id: 'EventBusService' });

    expect(() => registry.register({ id: 'EventBusService' })).toThrow('Service already registered: EventBusService');
  });
});
