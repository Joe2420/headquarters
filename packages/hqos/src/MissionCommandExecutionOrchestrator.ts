import type { MissionCommand } from './MissionCommands';
import type { MissionCommandExecutionContext, MissionCommandHandlerResult } from './MissionCommandHandler';
import { MissionCommandDispatcher } from './MissionCommandDispatcher';
import type { MissionCommandExecutionHandler, MissionCommandExecutionResult } from './MissionCommandExecutionHandler';
import type { MissionCommandResultEventCandidate } from './MissionCommandResultEvents';
import { mapMissionCommandExecutionResultToEventCandidate } from './MissionCommandExecutionResultEvents';

export interface MissionCommandExecutionOrchestrationResult {
  readonly executionResult: MissionCommandHandlerResult<MissionCommandExecutionResult>;
  readonly eventCandidate: MissionCommandResultEventCandidate<MissionCommandExecutionResult>;
}

export class MissionCommandExecutionOrchestrator {
  private readonly dispatcher: MissionCommandDispatcher<MissionCommandExecutionResult>;

  constructor(executionHandler: MissionCommandExecutionHandler) {
    this.dispatcher = new MissionCommandDispatcher(executionHandler);
  }

  execute(
    command: MissionCommand,
    context: MissionCommandExecutionContext,
  ): Promise<MissionCommandExecutionOrchestrationResult> | MissionCommandExecutionOrchestrationResult {
    const executionResult = this.dispatcher.dispatch(command, context);

    if (executionResult instanceof Promise) {
      return executionResult.then((resolvedResult) => this.toOrchestrationResult(command, resolvedResult));
    }

    return this.toOrchestrationResult(command, executionResult);
  }

  private toOrchestrationResult(
    command: MissionCommand,
    executionResult: MissionCommandHandlerResult<MissionCommandExecutionResult>,
  ): MissionCommandExecutionOrchestrationResult {
    return {
      executionResult,
      eventCandidate: mapMissionCommandExecutionResultToEventCandidate(command, executionResult),
    };
  }
}
