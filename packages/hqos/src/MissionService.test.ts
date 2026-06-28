import { describe, expect, it, vi } from 'vitest';
import type { HQEvent, Mission, MissionCreatedPayload } from '@headquarters/shared';
import { EventBus } from './EventBus';
import { MissionService } from './MissionService';

const missionId = '11111111-1111-4111-8111-111111111111';
const campaignId = '22222222-2222-4222-8222-222222222222';
const eventId = '33333333-3333-4333-8333-333333333333';
const requestedAt = '2026-06-28T20:00:00.000Z';

describe('MissionService', () => {
  it('creates a mission, persists the record, and emits MissionCreated', async () => {
    const savedMissions: Mission[] = [];
    const publishedEvents: HQEvent<MissionCreatedPayload>[] = [];
    const service = new MissionService(
      {
        save: (mission) => {
          savedMissions.push(mission);
        },
      },
      {
        publish: (event) => {
          publishedEvents.push(event);
        },
      },
      {
        createMissionId: () => missionId,
        createEventId: () => eventId,
        source: 'MissionServiceTest',
      },
    );

    const result = await service.createMission({
      codename: 'First Mission',
      campaignId,
      objective: 'Persist the first mission',
      requestedAt,
      correlationId: '44444444-4444-4444-8444-444444444444',
    });

    expect(result.mission).toEqual({
      id: missionId,
      campaignId,
      codename: 'First Mission',
      state: 'idle',
      objective: 'Persist the first mission',
      createdAt: requestedAt,
      updatedAt: requestedAt,
    });
    expect(savedMissions).toEqual([result.mission]);
    expect(publishedEvents).toEqual([result.event]);
    expect(result.event).toEqual({
      id: eventId,
      type: 'mission.created',
      version: 1,
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      campaignId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      priority: 'white',
      payload: {
        missionId,
        campaignId,
        codename: 'First Mission',
        objective: 'Persist the first mission',
      },
    });
  });

  it('publishes MissionCreated through the existing EventBus contract', async () => {
    const bus = new EventBus();
    const received: string[] = [];
    bus.subscribe('mission.created', (event) => {
      received.push(`${event.payload.missionId}:${event.payload.codename}`);
    });
    const service = new MissionService(
      { save: vi.fn() },
      bus,
      {
        createMissionId: () => missionId,
        createEventId: () => eventId,
      },
    );

    await service.createMission({
      codename: 'Evented Mission',
      requestedAt,
    });

    expect(received).toEqual([`${missionId}:Evented Mission`]);
    expect(bus.getHistoryByType('mission.created')).toHaveLength(1);
  });
});
