import type { MissionCommand } from './MissionCommands';
import type { MissionCommandExecutionContext } from './MissionCommandHandler';
import type {
  MissionCommandExecutionOrchestrationResult,
  MissionCommandExecutionOrchestrator,
} from './MissionCommandExecutionOrchestrator';
import type {
  MissionCommandPersistenceComposition,
  MissionCommandPersistenceCompositionResult,
} from './MissionCommandPersistenceComposition';

type MissionCommandExecutionOrchestratorPort = Pick<MissionCommandExecutionOrchestrator, 'execute'>;
type MissionCommandPersistenceCompositionPort = Pick<MissionCommandPersistenceComposition, 'persist'>;

export type MissionCommandPersistedExecutionPipelineResult = MissionCommandPersistenceCompositionResult;

export class MissionCommandPersistedExecutionPipeline {
  constructor(
    private readonly executionOrchestrator: MissionCommandExecutionOrchestratorPort,
    private readonly persistenceComposition: MissionCommandPersistenceCompositionPort,
  ) {}

  executeAndPersist(
    command: MissionCommand,
    context: MissionCommandExecutionContext,
  ): Promise<MissionCommandPersistedExecutionPipelineResult> | MissionCommandPersistedExecutionPipelineResult {
    const orchestrationResult = this.executionOrchestrator.execute(command, context);

    if (orchestrationResult instanceof Promise) {
      return orchestrationResult.then((resolvedResult) => this.persist(resolvedResult));
    }

    return this.persist(orchestrationResult);
  }

  private persist(
    orchestrationResult: MissionCommandExecutionOrchestrationResult,
  ): Promise<MissionCommandPersistedExecutionPipelineResult> | MissionCommandPersistedExecutionPipelineResult {
    return this.persistenceComposition.persist(orchestrationResult);
  }
}
