import type { HQEvent, Mission, MissionState, MissionStateChangedPayload } from '@headquarters/shared';
import { createEventEnvelope } from './events';

export const MISSION_STATES = [
  'idle',
  'briefing',
  'ready',
  'observation',
  'authorization',
  'deployed',
  'return_to_base',
  'debrief',
  'archived',
] as const satisfies readonly MissionState[];

export const MISSION_TRANSITIONS = {
  idle: ['briefing'],
  briefing: ['ready'],
  ready: ['observation'],
  observation: ['authorization'],
  authorization: ['deployed'],
  deployed: ['return_to_base'],
  return_to_base: ['debrief'],
  debrief: ['archived'],
  archived: [],
} as const satisfies Record<MissionState, readonly MissionState[]>;

export interface MissionTransitionResult {
  mission: Mission;
  event: HQEvent<MissionStateChangedPayload>;
}

export interface MissionTransitionOptions {
  reason?: string;
  occurredAt?: string;
  correlationId?: string;
  causationId?: string;
}

export class InvalidMissionTransitionError extends Error {
  constructor(
    readonly missionId: string,
    readonly from: MissionState,
    readonly to: MissionState,
  ) {
    super(`Invalid mission transition for ${missionId}: ${from} -> ${to}`);
    this.name = 'InvalidMissionTransitionError';
  }
}

export class MissionKernel {
  createMission(codename: string): Mission {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      codename,
      state: 'idle',
      createdAt: now,
      updatedAt: now,
    };
  }

  transition(mission: Mission, nextState: MissionState, options: MissionTransitionOptions = {}): MissionTransitionResult {
    if (!this.canTransition(mission.state, nextState)) {
      throw new InvalidMissionTransitionError(mission.id, mission.state, nextState);
    }

    const updatedAt = options.occurredAt ?? new Date().toISOString();
    const nextMission = {
      ...mission,
      state: nextState,
      updatedAt,
    };

    return {
      mission: nextMission,
      event: this.createStateChangedEvent(mission, nextMission, options),
    };
  }

  canTransition(from: MissionState, to: MissionState): boolean {
    return (MISSION_TRANSITIONS[from] as readonly MissionState[]).includes(to);
  }

  getAllowedTransitions(state: MissionState): readonly MissionState[] {
    return MISSION_TRANSITIONS[state];
  }

  createStateChangedEvent(
    previousMission: Mission,
    nextMission: Mission,
    options: MissionTransitionOptions = {},
  ): HQEvent<MissionStateChangedPayload> {
    return createEventEnvelope({
      type: 'mission.state.changed',
      source: 'MissionKernel',
      missionId: nextMission.id,
      payload: {
        missionId: nextMission.id,
        from: previousMission.state,
        to: nextMission.state,
        ...(options.reason !== undefined ? { reason: options.reason } : {}),
      },
      ...(options.occurredAt !== undefined ? { occurredAt: options.occurredAt } : {}),
      ...(options.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
      ...(options.causationId !== undefined ? { causationId: options.causationId } : {}),
    });
  }
}
