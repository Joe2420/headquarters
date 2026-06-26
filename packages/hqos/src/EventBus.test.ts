import { describe, expect, it } from 'vitest';
import { createEventEnvelope } from './events';
import { EventBus, InvalidEventEnvelopeError } from './EventBus';

const eventId = '11111111-1111-4111-8111-111111111111';
const secondEventId = '22222222-2222-4222-8222-222222222222';
const missionId = '33333333-3333-4333-8333-333333333333';
const occurredAt = '2026-06-26T18:00:00.000Z';

describe('EventBus', () => {
  it('publishes registry-backed events to subscribers in order', async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.subscribe('mission.created', async (event) => {
      received.push(`${event.type}:${event.payload.codename}`);
    });

    await bus.publish(createEventEnvelope({
      id: eventId,
      type: 'mission.created',
      source: 'hqos',
      occurredAt,
      payload: { missionId, codename: 'Quiet Bus' },
    }));

    await bus.publish(createEventEnvelope({
      id: secondEventId,
      type: 'mission.created',
      source: 'hqos',
      occurredAt,
      payload: { missionId, codename: 'Quiet Bus II' },
    }));

    expect(received).toEqual(['mission.created:Quiet Bus', 'mission.created:Quiet Bus II']);
  });

  it('unsubscribes handlers', async () => {
    const bus = new EventBus();
    const received: string[] = [];
    const unsubscribe = bus.subscribe('mission.created', (event) => {
      received.push(event.payload.codename);
    });

    unsubscribe();

    await bus.publish(createEventEnvelope({
      id: eventId,
      type: 'mission.created',
      source: 'hqos',
      occurredAt,
      payload: { missionId, codename: 'Silent Mission' },
    }));

    expect(received).toEqual([]);
  });

  it('records bounded event history', async () => {
    const bus = new EventBus({ historyLimit: 1 });

    await bus.publish(createEventEnvelope({
      id: eventId,
      type: 'mission.created',
      source: 'hqos',
      occurredAt,
      payload: { missionId, codename: 'First' },
    }));

    await bus.publish(createEventEnvelope({
      id: secondEventId,
      type: 'mission.created',
      source: 'hqos',
      occurredAt,
      payload: { missionId, codename: 'Second' },
    }));

    expect(bus.getHistory()).toHaveLength(1);
    expect(bus.getHistoryByType('mission.created')[0]?.payload.codename).toBe('Second');
  });

  it('rejects invalid envelopes before dispatch', async () => {
    const bus = new EventBus();
    const received: string[] = [];
    bus.subscribe('mission.created', (event) => {
      received.push(event.type);
    });

    await expect(bus.publish({
      id: 'not-a-uuid',
      type: 'mission.created',
      version: 1,
      occurredAt,
      source: 'hqos',
      priority: 'white',
      payload: { missionId, codename: 'Invalid' },
    })).rejects.toBeInstanceOf(InvalidEventEnvelopeError);

    expect(received).toEqual([]);
    expect(bus.getHistory()).toHaveLength(0);
  });
});
