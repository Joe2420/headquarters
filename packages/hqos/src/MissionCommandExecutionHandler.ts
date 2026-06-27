import type { Mission, MissionState } from '@headquarters/shared';
import type {
  ChangeMissionStateCommand,
  CompleteMissionCommand,
  CreateMissionCommand,
  MissionCommand,
  RequestMissionAuthorizationCommand,
  StartMissionCommand,
} from './MissionCommands';
import type {
  MissionCommandExecutionContext,
  MissionCommandHandler,
  MissionCommandHandlerDependencies,
  MissionCommandHandlerFailure,
  MissionCommandHandlerResult,
  ValidatedMissionCommand,
} from './MissionCommandHandler';
import { InvalidMissionTransitionError, MissionKernel } from './MissionKernel';

export interface MissionCommandExecutionResult {
  readonly mission: Mission;
}

export class MissionCommandExecutionHandler implements MissionCommandHandler<MissionCommandExecutionResult> {
  constructor(
    private readonly missionKernel: MissionKernel,
    private readonly dependencies: MissionCommandHandlerDependencies = {},
  ) {}

  handle(
    validatedCommand: ValidatedMissionCommand,
    context: MissionCommandExecutionContext,
  ): MissionCommandHandlerResult<MissionCommandExecutionResult> {
    const command = validatedCommand.command;

    switch (command.type) {
      case 'mission.create':
        return this.succeed(command, createMissionFromCommand(command));
      case 'mission.authorization.request':
        return this.transition(command, context, 'authorization');
      case 'mission.start':
        return this.transition(command, context, 'briefing');
      case 'mission.state.change':
        return this.transition(command, context, command.targetState);
      case 'mission.complete':
        return this.transition(command, context, 'archived');
      case 'mission.abort':
        return this.transition(command, context, 'return_to_base');
    }
  }

  private transition(
    command:
      | RequestMissionAuthorizationCommand
      | StartMissionCommand
      | ChangeMissionStateCommand
      | CompleteMissionCommand
      | MissionCommand,
    context: MissionCommandExecutionContext,
    targetState: MissionState,
  ): MissionCommandHandlerResult<MissionCommandExecutionResult> {
    const missionId = 'missionId' in command ? command.missionId : undefined;
    if (missionId === undefined) {
      return this.fail(command, 'mission.not_found', 'Mission id is required for this command.');
    }

    const mission = this.dependencies.loadMission?.(missionId);
    if (mission === undefined) {
      return this.fail(command, 'mission.not_found', `Mission ${missionId} was not found.`);
    }

    try {
      const transition = this.missionKernel.transition(mission, targetState, {
        occurredAt: command.requestedAt || context.now(),
        ...('reason' in command && command.reason !== undefined ? { reason: command.reason } : {}),
        ...(command.correlationId !== undefined ? { correlationId: command.correlationId } : {}),
        ...(command.causationId !== undefined ? { causationId: command.causationId } : {}),
      });
      return this.succeed(command, transition.mission);
    } catch (error) {
      if (error instanceof InvalidMissionTransitionError) {
        return this.fail(command, 'mission.transition_invalid', error.message);
      }

      throw error;
    }
  }

  private succeed(command: MissionCommand, mission: Mission): MissionCommandHandlerResult<MissionCommandExecutionResult> {
    return {
      ok: true,
      commandId: command.commandId,
      result: {
        mission,
      },
    };
  }

  private fail(
    command: MissionCommand,
    code: MissionCommandHandlerFailure['code'],
    message: string,
  ): MissionCommandHandlerFailure {
    return {
      ok: false,
      commandId: command.commandId,
      code,
      message,
    };
  }
}

function createMissionFromCommand(command: CreateMissionCommand): Mission {
  return {
    id: command.commandId,
    ...(command.campaignId !== undefined ? { campaignId: command.campaignId } : {}),
    codename: command.codename,
    state: 'idle',
    ...(command.objective !== undefined ? { objective: command.objective } : {}),
    createdAt: command.requestedAt,
    updatedAt: command.requestedAt,
  };
}
