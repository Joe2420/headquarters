import { describe, expect, it, vi } from 'vitest';
import type { HQEvent, Mission } from '@headquarters/shared';
import { EventBus } from './EventBus';
import {
  InvalidMissionTransitionError,
  MissionAuthorizationStateError,
  MissionDebriefNotFoundError,
  MissionDebriefRepositoryNotConfiguredError,
  MissionNotFoundError,
  MissionObservationSessionNotFoundError,
  MissionService,
  type MissionDebriefRecord,
  type MissionObservationSession,
} from './MissionService';

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

  it('starts observation, stores an active session, and emits MissionObservationStarted', async () => {
    const mission = createMission('ready');
    const save = vi.fn();
    const publish = vi.fn();
    const start = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      {
        createObservationSessionId: () => '55555555-5555-4555-8555-555555555555',
        source: 'MissionServiceTest',
      },
      undefined,
      {
        start,
        complete: vi.fn(),
        findActiveByMissionId: () => undefined,
      },
    );

    const result = await service.startObservation({
      missionId,
      requestedAt,
      correlationId: '44444444-4444-4444-8444-444444444444',
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'observation',
      updatedAt: requestedAt,
    });
    expect(result.session).toEqual({
      id: '55555555-5555-4555-8555-555555555555',
      missionId,
      startedAt: requestedAt,
    });
    expect(result.event).toMatchObject({
      type: 'mission.observation_started',
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      payload: { missionId },
    });
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(start).toHaveBeenCalledWith(result.session);
    expect(publish).toHaveBeenCalledWith(result.event);
  });

  it('completes observation, stores duration, and emits state change', async () => {
    const mission = createMission('observation');
    const activeSession: MissionObservationSession = {
      id: '55555555-5555-4555-8555-555555555555',
      missionId,
      startedAt: '2026-06-28T20:00:00.000Z',
    };
    const save = vi.fn();
    const publish = vi.fn();
    const complete = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      { source: 'MissionServiceTest' },
      undefined,
      {
        start: vi.fn(),
        complete,
        findActiveByMissionId: () => activeSession,
      },
    );

    const result = await service.completeObservation({
      missionId,
      requestedAt: '2026-06-28T20:05:00.000Z',
      correlationId: '44444444-4444-4444-8444-444444444444',
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'authorization',
      updatedAt: '2026-06-28T20:05:00.000Z',
    });
    expect(result.session).toEqual({
      ...activeSession,
      completedAt: '2026-06-28T20:05:00.000Z',
      durationMs: 300000,
    });
    expect(result.event).toMatchObject({
      type: 'mission.state.changed',
      occurredAt: '2026-06-28T20:05:00.000Z',
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      payload: {
        missionId,
        from: 'observation',
        to: 'authorization',
      },
    });
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(complete).toHaveBeenCalledWith(result.session);
    expect(publish).toHaveBeenCalledWith(result.event);
  });

  it('rejects invalid observation transitions before session tracking or event publication', async () => {
    const save = vi.fn();
    const start = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => createMission('idle'),
      },
      { publish },
      {},
      undefined,
      {
        start,
        complete: vi.fn(),
        findActiveByMissionId: () => undefined,
      },
    );

    await expect(service.startObservation({ missionId, requestedAt })).rejects.toBeInstanceOf(
      InvalidMissionTransitionError,
    );
    expect(save).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('rejects observation completion when no active session exists', async () => {
    const save = vi.fn();
    const publish = vi.fn();
    const complete = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => createMission('observation'),
      },
      { publish },
      {},
      undefined,
      {
        start: vi.fn(),
        complete,
        findActiveByMissionId: () => undefined,
      },
    );

    await expect(service.completeObservation({ missionId, requestedAt })).rejects.toBeInstanceOf(
      MissionObservationSessionNotFoundError,
    );
    expect(save).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('requests authorization and emits deterministic approval events', async () => {
    const mission = createMission('authorization');
    const publish = vi.fn();
    const createEventId = vi
      .fn()
      .mockReturnValueOnce('55555555-5555-4555-8555-555555555555')
      .mockReturnValueOnce('66666666-6666-4666-8666-666666666666');
    const service = new MissionService(
      {
        save: vi.fn(),
        findById: () => mission,
      },
      { publish },
      {
        createEventId,
        source: 'MissionServiceTest',
      },
    );

    const result = await service.requestAuthorization({
      missionId,
      requestedAt,
      correlationId: '44444444-4444-4444-8444-444444444444',
      setupSummary: 'Breakout retest is complete.',
      riskPlanned: 0.5,
      invalidation: 'Close below the briefing level.',
      operatorJustification: 'Checklist complete and risk is defined.',
    });

    expect(result.decision).toEqual({
      decision: 'approved',
      reason: 'Manual authorization fields are complete.',
      confidence: 1,
      evidenceRefs: ['operatorJustification', 'invalidation'],
    });
    expect(result.requestEvent).toEqual({
      id: '55555555-5555-4555-8555-555555555555',
      type: 'mission.authorization_requested',
      version: 1,
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      priority: 'amber',
      payload: {
        missionId,
        setupSummary: 'Breakout retest is complete.',
        riskPlanned: 0.5,
        invalidation: 'Close below the briefing level.',
        operatorJustification: 'Checklist complete and risk is defined.',
      },
    });
    expect(result.responseEvent).toEqual({
      id: '66666666-6666-4666-8666-666666666666',
      type: 'mission.authorized',
      version: 1,
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      priority: 'green',
      payload: {
        missionId,
        confidence: 1,
        evidenceRefs: ['operatorJustification', 'invalidation'],
      },
    });
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenNthCalledWith(1, result.requestEvent);
    expect(publish).toHaveBeenNthCalledWith(2, result.responseEvent);
  });

  it('requests authorization and emits deterministic denial events when manual fields are incomplete', async () => {
    const mission = createMission('authorization');
    const publish = vi.fn();
    const service = new MissionService(
      {
        save: vi.fn(),
        findById: () => mission,
      },
      { publish },
      { source: 'MissionServiceTest' },
    );

    const result = await service.requestAuthorization({
      missionId,
      requestedAt,
      setupSummary: 'Setup noted without a complete operator justification.',
    });

    expect(result.decision).toEqual({
      decision: 'denied',
      reason: 'Manual authorization requires operator justification and invalidation.',
      evidenceRefs: ['operatorJustification', 'invalidation'],
    });
    expect(result.responseEvent).toMatchObject({
      type: 'mission.authorization_denied',
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      priority: 'red',
      payload: {
        missionId,
        reason: 'Manual authorization requires operator justification and invalidation.',
        evidenceRefs: ['operatorJustification', 'invalidation'],
      },
    });
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenNthCalledWith(1, result.requestEvent);
    expect(publish).toHaveBeenNthCalledWith(2, result.responseEvent);
  });

  it('rejects authorization requests outside authorization state before event publication', async () => {
    const publish = vi.fn();
    const service = new MissionService(
      {
        save: vi.fn(),
        findById: () => createMission('observation'),
      },
      { publish },
    );

    await expect(service.requestAuthorization({ missionId, requestedAt })).rejects.toBeInstanceOf(
      MissionAuthorizationStateError,
    );
    expect(publish).not.toHaveBeenCalled();
  });

  it('requests return to base, stores closing state, and emits mission events', async () => {
    const mission = createMission('deployed');
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      {
        createEventId: () => '55555555-5555-4555-8555-555555555555',
        source: 'MissionServiceTest',
      },
    );

    const result = await service.requestReturnToBase({
      missionId,
      requestedAt,
      correlationId: '44444444-4444-4444-8444-444444444444',
      reason: 'Mission closing protocol initiated.',
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'return_to_base',
      updatedAt: requestedAt,
    });
    expect(result.requestEvent).toEqual({
      id: '55555555-5555-4555-8555-555555555555',
      type: 'mission.return_to_base_requested',
      version: 1,
      occurredAt: requestedAt,
      source: 'MissionServiceTest',
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      priority: 'amber',
      payload: {
        missionId,
        reason: 'Mission closing protocol initiated.',
      },
    });
    expect(result.transitionEvent).toMatchObject({
      type: 'mission.state.changed',
      occurredAt: requestedAt,
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      payload: {
        missionId,
        from: 'deployed',
        to: 'return_to_base',
        reason: 'Mission closing protocol initiated.',
      },
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenNthCalledWith(1, result.requestEvent);
    expect(publish).toHaveBeenNthCalledWith(2, result.transitionEvent);
  });

  it('rejects invalid return-to-base transitions before persistence or event publication', async () => {
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => createMission('authorization'),
      },
      { publish },
    );

    await expect(service.requestReturnToBase({ missionId, requestedAt })).rejects.toBeInstanceOf(
      InvalidMissionTransitionError,
    );
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('saves a behavior-first debrief and moves mission into debrief state', async () => {
    const mission = createMission('return_to_base');
    const save = vi.fn();
    const publish = vi.fn();
    const saveDebrief = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      {
        createDebriefId: () => '55555555-5555-4555-8555-555555555555',
      },
      undefined,
      undefined,
      undefined,
      {
        save: saveDebrief,
        findByMissionId: () => undefined,
      },
    );

    const result = await service.saveDebrief({
      missionId,
      requestedAt,
      correlationId: '44444444-4444-4444-8444-444444444444',
      behaviorSummary: 'Stayed patient through the close.',
      disciplineNotes: 'Followed the stop plan.',
      lesson: 'Write invalidation before deployment.',
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'debrief',
      updatedAt: requestedAt,
    });
    expect(result.debrief).toEqual({
      id: '55555555-5555-4555-8555-555555555555',
      missionId,
      behaviorSummary: 'Stayed patient through the close.',
      disciplineNotes: 'Followed the stop plan.',
      lesson: 'Write invalidation before deployment.',
      createdAt: requestedAt,
    });
    expect(result.event).toMatchObject({
      type: 'mission.state.changed',
      occurredAt: requestedAt,
      missionId,
      correlationId: '44444444-4444-4444-8444-444444444444',
      payload: {
        missionId,
        from: 'return_to_base',
        to: 'debrief',
        reason: 'Mission debrief saved.',
      },
    });
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(saveDebrief).toHaveBeenCalledWith(result.debrief);
    expect(publish).toHaveBeenCalledWith(result.event);
  });

  it('requires a debrief repository before saving debriefs', async () => {
    const service = new MissionService(
      {
        save: vi.fn(),
        findById: () => createMission('return_to_base'),
      },
      { publish: vi.fn() },
    );

    await expect(
      service.saveDebrief({
        missionId,
        requestedAt,
        behaviorSummary: 'Stayed patient.',
        disciplineNotes: 'Followed plan.',
        lesson: 'Prepare earlier.',
      }),
    ).rejects.toBeInstanceOf(MissionDebriefRepositoryNotConfiguredError);
  });

  it('archives only after a debrief exists', async () => {
    const mission = createMission('debrief');
    const debrief: MissionDebriefRecord = {
      id: '55555555-5555-4555-8555-555555555555',
      missionId,
      behaviorSummary: 'Stayed patient through the close.',
      disciplineNotes: 'Followed the stop plan.',
      lesson: 'Write invalidation before deployment.',
      createdAt: '2026-06-28T20:05:00.000Z',
    };
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => mission,
      },
      { publish },
      {},
      undefined,
      undefined,
      undefined,
      {
        save: vi.fn(),
        findByMissionId: () => debrief,
      },
    );

    const result = await service.archiveAfterDebrief({
      missionId,
      requestedAt,
      reason: 'Debrief complete.',
    });

    expect(result.mission).toEqual({
      ...mission,
      state: 'archived',
      updatedAt: requestedAt,
    });
    expect(result.event).toMatchObject({
      type: 'mission.state.changed',
      payload: {
        missionId,
        from: 'debrief',
        to: 'archived',
        reason: 'Debrief complete.',
      },
    });
    expect(save).toHaveBeenCalledWith(result.mission);
    expect(publish).toHaveBeenCalledWith(result.event);
  });

  it('rejects archive transition when no debrief exists', async () => {
    const save = vi.fn();
    const publish = vi.fn();
    const service = new MissionService(
      {
        save,
        findById: () => createMission('debrief'),
      },
      { publish },
      {},
      undefined,
      undefined,
      undefined,
      {
        save: vi.fn(),
        findByMissionId: () => undefined,
      },
    );

    await expect(service.archiveAfterDebrief({ missionId, requestedAt })).rejects.toBeInstanceOf(
      MissionDebriefNotFoundError,
    );
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
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
