import { describe, expect, it, vi } from 'vitest';
import type { HQEvent, Mission } from '@headquarters/shared';
import { EventBus } from './EventBus';
import { InvalidMissionTransitionError, MissionNotFoundError, MissionService } from './MissionService';

const missionId = '11111111-1111-4111-8111-111111111111';
const campaignId = '22222222-2222-4222-8222-222222222222';
const eventId = '33333333-3333-4333-8333-333333333333';
const requestedAt = '2026-06-28T20:00:00.000Z';

describe('MissionService', () => {
  it('creates a mission, persists the record, and emits MissionCreated', async () => {
    const savedMissions: Mission[] = [];
    const publishedEvents: HQEvent[] = [];
    const service = new MissionService(
      {
        save: (mission) => {
          savedMissions.push(mission);
        },
        findById: () => undefined,
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
      { save: vi.fn(), findById: () => undefined },
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

  it('starts briefing, stores briefing state, and emits MissionBriefingStarted', async () => {
    const mission = createMission('idle');
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      { source: 'MissionServiceTest' },
    );

    const result = await service.startBriefing({
      missionId,
      requestedAt,
      correlationId: '44444444-4444-4444-8444-444444444444',
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'briefing',
      updatedAt: requestedAt,
    });
    expect(result.event).toMatchObject({
      type: 'mission.briefing_started',
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      payload: { missionId },
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(result.event);
  });

  it('completes briefing, stores ready state, and emits MissionBriefingCompleted', async () => {
    const mission = createMission('briefing');
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      { source: 'MissionServiceTest' },
    );

    const result = await service.completeBriefing({
      missionId,
      requestedAt,
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'ready',
      updatedAt: requestedAt,
    });
    expect(result.event).toMatchObject({
      type: 'mission.briefing_completed',
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      payload: { missionId },
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(result.event);
  });

  it('rejects invalid briefing transitions before persistence or event publication', async () => {
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => createMission('ready'),
      },
      { publish },
    );

    await expect(service.startBriefing({ missionId, requestedAt })).rejects.toBeInstanceOf(
      InvalidMissionTransitionError,
    );
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('rejects missing missions before briefing transitions', async () => {
    const service = new MissionService(
      {
        save: vi.fn(),
        findById: () => undefined,
      },
      { publish: vi.fn() },
    );

    await expect(service.startBriefing({ missionId, requestedAt })).rejects.toBeInstanceOf(MissionNotFoundError);
  });
});

function createMission(state: Mission['state']): Mission {
  return {
    id: missionId,
    codename: 'Briefing Mission',
    state,
    createdAt: '2026-06-28T19:00:00.000Z',
    updatedAt: '2026-06-28T19:00:00.000Z',
  };
}
