import { describe, expect, it, vi } from 'vitest';
import type { HQEvent } from '@headquarters/shared';
import { MissionCommandArchivePersistenceAdapter } from './MissionCommandArchivePersistenceAdapter';
import type { MissionCommandPersistenceRequest } from './MissionCommandPersistencePort';
import type { MissionCommandExecutionResult } from './MissionCommandExecutionHandler';

const commandId = '11111111-1111-4111-8111-111111111111';
const eventId = '33333333-3333-4333-8333-333333333333';
const occurredAt = '2026-06-28T09:30:00.000Z';
const missionId = '22222222-2222-4222-8222-222222222222';

function createSuccessRequest(): MissionCommandPersistenceRequest<MissionCommandExecutionResult> {
  return {
    commandId,
    commandType: 'mission.start',
    eventCandidate: {
      type: 'mission.command.succeeded',
      payload: {
        commandId,
        commandType: 'mission.start',
        ok: true,
        result: {
          mission: {
            id: missionId,
            codename: 'Archive Adapter Mission',
            state: 'briefing',
            createdAt: '2026-06-28T09:00:00.000Z',
            updatedAt: occurredAt,
          },
        },
      },
    },
  };
}

describe('MissionCommandArchivePersistenceAdapter', () => {
  it('appends command result event candidates as canonical archive events', () => {
    const append = vi.fn();
    const adapter = new MissionCommandArchivePersistenceAdapter(
      { append },
      {
        source: 'MissionCommandArchivePersistenceAdapter.test',
        now: () => occurredAt,
        createEventId: () => eventId,
      },
    );
    const request = createSuccessRequest();

    expect(adapter.appendCommandResultEventCandidate(request)).toEqual({
      ok: true,
      commandId,
      eventType: 'mission.command.succeeded',
    });

    const expectedEvent: HQEvent = {
      id: eventId,
      type: 'mission.command.succeeded',
      version: 1,
      occurredAt,
      source: 'MissionCommandArchivePersistenceAdapter.test',
      priority: 'white',
      correlationId: commandId,
      payload: request.eventCandidate.payload,
    };
    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith(expectedEvent);
  });

  it('appends failed command result candidates without EventBus behavior', () => {
    const append = vi.fn();
    const adapter = new MissionCommandArchivePersistenceAdapter(
      { append },
      {
        now: () => occurredAt,
        createEventId: () => eventId,
      },
    );
    const request: MissionCommandPersistenceRequest<MissionCommandExecutionResult> = {
      commandId,
      commandType: 'mission.start',
      eventCandidate: {
        type: 'mission.command.failed',
        payload: {
          commandId,
          commandType: 'mission.start',
          ok: false,
          code: 'mission.not_found',
          message: 'Mission was not found.',
        },
      },
    };

    expect(adapter.appendCommandResultEventCandidate(request)).toEqual({
      ok: true,
      commandId,
      eventType: 'mission.command.failed',
    });
    expect(append).toHaveBeenCalledWith({
      id: eventId,
      type: 'mission.command.failed',
      version: 1,
      occurredAt,
      source: 'MissionCommandArchivePersistenceAdapter',
      priority: 'amber',
      correlationId: commandId,
      payload: request.eventCandidate.payload,
    });
  });
});
