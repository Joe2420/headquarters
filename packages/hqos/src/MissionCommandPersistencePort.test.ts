import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  MissionCommandPersistencePort,
  MissionCommandPersistenceRequest,
  MissionCommandPersistenceResult,
} from './MissionCommandPersistencePort';

const commandId = '11111111-1111-4111-8111-111111111111';

describe('MissionCommandPersistencePort', () => {
  it('defines an infrastructure-agnostic append contract for command result event candidates', () => {
    const request: MissionCommandPersistenceRequest<{ accepted: true }> = {
      commandId,
      commandType: 'mission.start',
      eventCandidate: {
        type: 'mission.command.succeeded',
        payload: {
          commandId,
          commandType: 'mission.start',
          ok: true,
          result: { accepted: true },
        },
      },
    };
    const port: MissionCommandPersistencePort<{ accepted: true }> = {
      appendCommandResultEventCandidate(receivedRequest): MissionCommandPersistenceResult {
        return {
          ok: true,
          ...(receivedRequest.commandId !== undefined ? { commandId: receivedRequest.commandId } : {}),
          eventType: receivedRequest.eventCandidate.type,
        };
      },
    };

    expect(port.appendCommandResultEventCandidate(request)).toEqual({
      ok: true,
      commandId,
      eventType: 'mission.command.succeeded',
    });
  });

  it('keeps request and result contracts type-focused', () => {
    expectTypeOf<MissionCommandPersistenceRequest<{ missionId: string }>['eventCandidate']>().toMatchTypeOf<{
      readonly type: 'mission.command.succeeded' | 'mission.command.failed';
    }>();
    expectTypeOf<MissionCommandPersistenceResult>().toMatchTypeOf<{ readonly ok: boolean }>();
  });
});
