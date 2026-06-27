import type { MissionCommand } from './MissionCommands';
import type { MissionCommandHandlerResult } from './MissionCommandHandler';
import type { MissionCommandExecutionResult } from './MissionCommandExecutionHandler';
import type { MissionCommandResultEventCandidate } from './MissionCommandResultEvents';
import { mapMissionCommandResultToEventCandidate } from './MissionCommandResultEvents';

export function mapMissionCommandExecutionResultToEventCandidate(
  command: MissionCommand,
  result: MissionCommandHandlerResult<MissionCommandExecutionResult>,
): MissionCommandResultEventCandidate<MissionCommandExecutionResult> {
  return mapMissionCommandResultToEventCandidate(command, result);
}
