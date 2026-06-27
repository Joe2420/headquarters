import { describe, expect, it } from 'vitest';
import type { EventEnvelope, HQEvent, MissionStateChangedPayload } from './events';

const timestamp = '2026-06-26T18:00:00.000Z';

describe('shared event types', () => {
  it('represent the canonical serializable HQ event envelope', () => {
    const payload: MissionStateChangedPayload = {
      missionId: 'mission-1',
      from: 'idle',
      to: 'briefing',
    };

    const event: HQEvent<MissionStateChangedPayload> = {
      id: 'event-1',
      type: 'mission.state.changed',
      version: 1,
      occurredAt: timestamp,
      source: 'hqos',
      missionId: payload.missionId,
      correlationId: 'correlation-1',
      priority: 'white',
      payload,
    };

    const envelope: EventEnvelope<MissionStateChangedPayload> = event;

    expect(envelope.type).toBe('mission.state.changed');
    expect(JSON.parse(JSON.stringify(envelope))).toEqual(event);
  });
});
