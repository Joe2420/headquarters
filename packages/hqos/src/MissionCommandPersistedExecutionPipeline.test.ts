import { describe, expect, it, vi } from 'vitest';
import type { Mission } from '@headquarters/shared';
import type { StartMissionCommand } from './MissionCommands';
import type { MissionCommandExecutionContext } from './MissionCommandHandler';
import type { MissionCommandExecutionOrchestrationResult } from './MissionCommandExecutionOrchestrator';
import { MissionCommandPersistedExecutionPipeline } from './MissionCommandPersistedExecutionPipeline';

const commandId = '11111111-1111-4111-8111-111111111111';
const missionId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-06-28T12:00:00.000Z';
const context: MissionCommandExecutionContext = {
  now: () => requestedAt,
};
const command: StartMissionCommand = {
  type: 'mission.start',
  commandId,
  requestedAt,
  missionId,
};

function createMission(): Mission {
  return {
    id: missionId,
    codename: 'Persisted Pipeline Mission',
    state: 'briefing',
    createdAt: '2026-06-28T11:00:00.000Z',
    updatedAt: requestedAt,
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

describe('MissionCommandPersistedExecutionPipeline', () => {
  it('executes a command and persists the resulting event candidate', () => {
    const orchestrationResult = createOrchestrationResult();
    const executionOrchestrator = {
      execute: vi.fn(() => orchestrationResult),
    };
    const persistenceComposition = {
      persist: vi.fn(() => {
        return {
          executionResult: orchestrationResult.executionResult,
          eventCandidate: orchestrationResult.eventCandidate,
          persistenceResult: {
            ok: true as const,
            commandId,
            eventType: 'mission.command.succeeded' as const,
          },
        };
      }),
    };
    const pipeline = new MissionCommandPersistedExecutionPipeline(
      executionOrchestrator,
      persistenceComposition,
    );

    expect(pipeline.executeAndPersist(command, context)).toEqual({
      executionResult: orchestrationResult.executionResult,
      eventCandidate: orchestrationResult.eventCandidate,
      persistenceResult: {
        ok: true,
        commandId,
        eventType: 'mission.command.succeeded',
      },
    });
    expect(executionOrchestrator.execute).toHaveBeenCalledTimes(1);
    expect(executionOrchestrator.execute).toHaveBeenCalledWith(command, context);
    expect(persistenceComposition.persist).toHaveBeenCalledTimes(1);
    expect(persistenceComposition.persist).toHaveBeenCalledWith(orchestrationResult);
  });

  it('supports async execution and async persistence without changing result shape', async () => {
    const orchestrationResult = createOrchestrationResult();
    const executionOrchestrator = {
      execute: vi.fn(async () => orchestrationResult),
    };
    const persistenceComposition = {
      persist: vi.fn(async () => {
        return {
          executionResult: orchestrationResult.executionResult,
          eventCandidate: orchestrationResult.eventCandidate,
          persistenceResult: {
            ok: false as const,
            commandId,
            code: 'mission_command_persistence_unavailable' as const,
            message: 'Persistence unavailable.',
          },
        };
      }),
    };
    const pipeline = new MissionCommandPersistedExecutionPipeline(
      executionOrchestrator,
      persistenceComposition,
    );

    await expect(pipeline.executeAndPersist(command, context)).resolves.toEqual({
      executionResult: orchestrationResult.executionResult,
      eventCandidate: orchestrationResult.eventCandidate,
      persistenceResult: {
        ok: false,
        commandId,
        code: 'mission_command_persistence_unavailable',
        message: 'Persistence unavailable.',
      },
    });
    expect(executionOrchestrator.execute).toHaveBeenCalledWith(command, context);
    expect(persistenceComposition.persist).toHaveBeenCalledWith(orchestrationResult);
  });
});
