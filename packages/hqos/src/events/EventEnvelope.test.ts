import { describe, expect, it } from 'vitest';
import { createEventEnvelope, isEventEnvelope, validateEventEnvelope } from './EventEnvelope';

const eventId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const occurredAt = '2026-06-26T18:00:00.000Z';

describe('HQOS event envelope foundation', () => {
  it('creates a canonical event envelope with defaults and optional trace fields', () => {
    const event = createEventEnvelope({
      id: eventId,
      type: 'mission.created',
      source: 'hqos',
      missionId,
      occurredAt,
      payload: { missionId, codename: 'Quiet Registry' },
    });

    expect(event).toEqual({
      id: eventId,
      type: 'mission.created',
      version: 1,
      occurredAt,
      source: 'hqos',
      missionId,
      priority: 'white',
      payload: { missionId, codename: 'Quiet Registry' },
    });
  });

  it('validates canonical event envelopes', () => {
    const event = createEventEnvelope({
      id: eventId,
      type: 'guardian.intervention_recommended',
      source: 'guardian',
      occurredAt,
      priority: 'red',
      correlationId: '33333333-3333-4333-8333-333333333333',
      payload: { interventionType: 'stand_down', reason: 'risk threshold crossed' },
    });

    expect(validateEventEnvelope(event)).toEqual({ valid: true, errors: [] });
    expect(isEventEnvelope(event)).toBe(true);
  });

  it('reports invalid envelopes without throwing', () => {
    const result = validateEventEnvelope({
      id: 'not-a-uuid',
      type: 'mission.created',
      version: 0,
      occurredAt: 'not-a-date',
      source: '',
      priority: 'blue',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'id must be a UUID',
      'version must be a positive integer',
      'occurredAt must be an ISO timestamp string',
      'source must be a non-empty string',
      'priority must be white, green, amber, red, or black',
      'payload is required',
    ]);
  });
});