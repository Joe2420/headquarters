import { describe, expect, it, vi } from 'vitest';
import type { Mission } from '@headquarters/shared';
import type { MissionCommandExecutionOrchestrationResult } from './MissionCommandExecutionOrchestrator';
import { MissionCommandPersistenceComposition } from './MissionCommandPersistenceComposition';
import type {
  MissionCommandPersistenceFailure,
  MissionCommandPersistencePort,
  MissionCommandPersistenceSuccess,
} from './MissionCommandPersistencePort';
import type { MissionCommandExecutionResult } from './MissionCommandExecutionHandler';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';

function createMission(): Mission {
  return {
    id: missionId,
    codename: 'Persistence Composition Mission',
    state: 'briefing',
    createdAt: '2026-06-27T11:00:00.000Z',
    updatedAt: '2026-06-27T12:00:00.000Z',
  };
}

function createOrchestrationResult(): MissionCommandExecutionOrchestrationResult {
  const mission = createMission();

  return {
    executionResult: {
      ok: true,
      commandId,
      result: { mission },
    },
    eventCandidate: {
      type: 'mission.command.succeeded',
      payload: {
        commandId,
        commandType: 'mission.start',
        ok: true,
        result: { mission },
      },
    },
  };
}

describe('MissionCommandPersistenceComposition', () => {
  it('passes the event candidate from an execution orchestration result to the persistence port', () => {
    const orchestrationResult = createOrchestrationResult();
    const port: MissionCommandPersistencePort<MissionCommandExecutionResult> = {
      appendCommandResultEventCandidate: vi.fn(() => {
        const result: MissionCommandPersistenceSuccess = {
          ok: true,
          commandId,
          eventType: 'mission.command.succeeded',
        };
        return result;
      }),
    };
    const composition = new MissionCommandPersistenceComposition(port);

    expect(composition.persist(orchestrationResult)).toEqual({
      executionResult: orchestrationResult.executionResult,
      eventCandidate: orchestrationResult.eventCandidate,
      persistenceResult: {
        ok: true,
        commandId,
        eventType: 'mission.command.succeeded',
      },
    });
    expect(port.appendCommandResultEventCandidate).toHaveBeenCalledTimes(1);
    expect(port.appendCommandResultEventCandidate).toHaveBeenCalledWith({
      commandId,
      commandType: 'mission.start',
      eventCandidate: orchestrationResult.eventCandidate,
    });
  });

  it('returns deterministic persistence failures without changing the execution result', async () => {
    const orchestrationResult = createOrchestrationResult();
    const port: MissionCommandPersistencePort<MissionCommandExecutionResult> = {
      appendCommandResultEventCandidate: vi.fn(async () => {
        const result: MissionCommandPersistenceFailure = {
          ok: false,
          commandId,
          code: 'mission_command_persistence_unavailable',
          message: 'Persistence port unavailable.',
        };
        return result;
      }),
    };
    const composition = new MissionCommandPersistenceComposition(port);

    await expect(composition.persist(orchestrationResult)).resolves.toEqual({
      executionResult: orchestrationResult.executionResult,
      eventCandidate: orchestrationResult.eventCandidate,
      persistenceResult: {
        ok: false,
        commandId,
        code: 'mission_command_persistence_unavailable',
        message: 'Persistence port unavailable.',
      },
    });
    expect(port.appendCommandResultEventCandidate).toHaveBeenCalledTimes(1);
  });
});
