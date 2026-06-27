import type { ArchiveRepository } from '@headquarters/database';
import type { Mission, MissionState } from '@headquarters/shared';
import {
  type MissionTransitionOptions,
  type MissionTransitionResult,
  MissionKernel,
} from './MissionKernel';

export class MissionLifecyclePersistence {
  constructor(
    private readonly missionKernel: MissionKernel,
    private readonly archiveRepository: ArchiveRepository,
  ) {}

  transitionAndPersist(
    mission: Mission,
    nextState: MissionState,
    options: MissionTransitionOptions = {},
  ): MissionTransitionResult {
    const result = this.missionKernel.transition(mission, nextState, options);
    this.archiveRepository.append(result.event);
    return result;
  }
}
