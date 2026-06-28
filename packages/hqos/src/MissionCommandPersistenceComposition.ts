import type { MissionCommandExecutionOrchestrationResult } from './MissionCommandExecutionOrchestrator';
import type { MissionCommandExecutionResult } from './MissionCommandExecutionHandler';
import type {
  MissionCommandPersistencePort,
  MissionCommandPersistenceRequest,
  MissionCommandPersistenceResult,
} from './MissionCommandPersistencePort';

export interface MissionCommandPersistenceCompositionResult {
  readonly executionResult: MissionCommandExecutionOrchestrationResult['executionResult'];
  readonly eventCandidate: MissionCommandExecutionOrchestrationResult['eventCandidate'];
  readonly persistenceResult: MissionCommandPersistenceResult;
}

export class MissionCommandPersistenceComposition {
  constructor(private readonly persistencePort: MissionCommandPersistencePort<MissionCommandExecutionResult>) {}

  persist(
    orchestrationResult: MissionCommandExecutionOrchestrationResult,
  ): Promise<MissionCommandPersistenceCompositionResult> | MissionCommandPersistenceCompositionResult {
    const persistenceResult = this.persistencePort.appendCommandResultEventCandidate(
      toPersistenceRequest(orchestrationResult),
    );

    if (persistenceResult instanceof Promise) {
      return persistenceResult.then((resolvedResult) =>
        toCompositionResult(orchestrationResult, resolvedResult),
      );
    }

    return toCompositionResult(orchestrationResult, persistenceResult);
  }
}

function toPersistenceRequest(
  orchestrationResult: MissionCommandExecutionOrchestrationResult,
): MissionCommandPersistenceRequest<MissionCommandExecutionResult> {
  const payload = orchestrationResult.eventCandidate.payload;

  return {
    ...('commandId' in payload && payload.commandId !== undefined ? { commandId: payload.commandId } : {}),
    commandType: payload.commandType,
    eventCandidate: orchestrationResult.eventCandidate,
  };
}

function toCompositionResult(
  orchestrationResult: MissionCommandExecutionOrchestrationResult,
  persistenceResult: MissionCommandPersistenceResult,
): MissionCommandPersistenceCompositionResult {
  return {
    executionResult: orchestrationResult.executionResult,
    eventCandidate: orchestrationResult.eventCandidate,
    persistenceResult,
  };
}
