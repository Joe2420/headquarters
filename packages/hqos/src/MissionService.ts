import type {
  EventPayloadMap,
  HeadquartersEventType,
  HQEvent,
  ISODateTime,
  Mission,
  MissionCreatedPayload,
  MissionStateChangedPayload,
  UUID,
} from '@headquarters/shared';
import { createEventEnvelope } from './events';
import { InvalidMissionTransitionError, MissionKernel } from './MissionKernel';

export interface CreateMissionInput {
  readonly codename: string;
  readonly campaignId?: UUID;
  readonly objective?: string;
  readonly requestedAt?: string;
  readonly correlationId?: UUID;
  readonly causationId?: UUID;
}

export interface MissionBriefingTransitionInput {
  readonly missionId: UUID;
  readonly requestedAt?: string;
  readonly correlationId?: UUID;
  readonly causationId?: UUID;
  readonly reason?: string;
}

export interface MissionObservationTransitionInput {
  readonly missionId: UUID;
  readonly requestedAt?: ISODateTime;
  readonly correlationId?: UUID;
  readonly causationId?: UUID;
  readonly reason?: string;
}

export interface MissionObservationSession {
  readonly id: UUID;
  readonly missionId: UUID;
  readonly startedAt: ISODateTime;
  readonly completedAt?: ISODateTime;
  readonly durationMs?: number;
}

export interface MissionRecordRepository {
  save(mission: Mission): Promise<void> | void;
  findById(id: UUID): Promise<Mission | undefined> | Mission | undefined;
}

export interface MissionObservationSessionRepository {
  start(session: MissionObservationSession): Promise<void> | void;
  complete(session: MissionObservationSession): Promise<void> | void;
  findActiveByMissionId(missionId: UUID): Promise<MissionObservationSession | undefined> | MissionObservationSession | undefined;
}

export interface MissionCreatedEventPublisher {
  publish(event: HQEvent): Promise<void> | void;
}

export interface MissionServiceOptions {
  readonly now?: () => string;
  readonly createMissionId?: () => UUID;
  readonly createEventId?: () => UUID;
  readonly createObservationSessionId?: () => UUID;
  readonly source?: string;
}

export interface MissionCreationResult {
  readonly mission: Mission;
  readonly event: HQEvent<MissionCreatedPayload>;
}

export interface MissionBriefingTransitionResult<TType extends HeadquartersEventType> {
  readonly mission: Mission;
  readonly event: HQEvent<EventPayloadMap[TType]>;
}

export interface MissionObservationStartResult {
  readonly mission: Mission;
  readonly session: MissionObservationSession;
  readonly event: HQEvent<EventPayloadMap['mission.observation_started']>;
}

export interface MissionObservationCompletionResult {
  readonly mission: Mission;
  readonly session: MissionObservationSession;
  readonly event: HQEvent<MissionStateChangedPayload>;
}

export class MissionNotFoundError extends Error {
  constructor(readonly missionId: UUID) {
    super(`Mission ${missionId} was not found.`);
    this.name = 'MissionNotFoundError';
  }
}

export class MissionObservationSessionNotFoundError extends Error {
  constructor(readonly missionId: UUID) {
    super(`Active observation session for mission ${missionId} was not found.`);
    this.name = 'MissionObservationSessionNotFoundError';
  }
}

export class MissionService {
  constructor(
    private readonly missionRepository: MissionRecordRepository,
    private readonly eventPublisher: MissionCreatedEventPublisher,
    private readonly options: MissionServiceOptions = {},
    private readonly missionKernel = new MissionKernel(),
    private readonly observationSessionRepository?: MissionObservationSessionRepository,
  ) {}

  async createMission(input: CreateMissionInput): Promise<MissionCreationResult> {
    const mission = this.createMissionRecord(input);
    const event = this.createMissionCreatedEvent(mission, input);

    await this.missionRepository.save(mission);
    await this.eventPublisher.publish(event);

    return { mission, event };
  }

  async startBriefing(
    input: MissionBriefingTransitionInput,
  ): Promise<MissionBriefingTransitionResult<'mission.briefing_started'>> {
    const mission = await this.loadMission(input.missionId);
    const transition = this.missionKernel.transition(mission, 'briefing', {
      ...(input.requestedAt !== undefined ? { occurredAt: input.requestedAt } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.causationId !== undefined ? { causationId: input.causationId } : {}),
    });
    const event = this.createMissionEvent('mission.briefing_started', transition.mission, input);

    await this.missionRepository.save(transition.mission);
    await this.eventPublisher.publish(event);

    return { mission: transition.mission, event };
  }

  async completeBriefing(
    input: MissionBriefingTransitionInput,
  ): Promise<MissionBriefingTransitionResult<'mission.briefing_completed'>> {
    const mission = await this.loadMission(input.missionId);
    const transition = this.missionKernel.transition(mission, 'ready', {
      ...(input.requestedAt !== undefined ? { occurredAt: input.requestedAt } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.causationId !== undefined ? { causationId: input.causationId } : {}),
    });
    const event = this.createMissionEvent('mission.briefing_completed', transition.mission, input);

    await this.missionRepository.save(transition.mission);
    await this.eventPublisher.publish(event);

    return { mission: transition.mission, event };
  }

  async startObservation(input: MissionObservationTransitionInput): Promise<MissionObservationStartResult> {
    const mission = await this.loadMission(input.missionId);
    const transition = this.missionKernel.transition(mission, 'observation', {
      ...(input.requestedAt !== undefined ? { occurredAt: input.requestedAt } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.causationId !== undefined ? { causationId: input.causationId } : {}),
    });
    const session: MissionObservationSession = {
      id: this.options.createObservationSessionId?.() ?? createMissionId(),
      missionId: transition.mission.id,
      startedAt: transition.mission.updatedAt,
    };
    const event = this.createMissionEvent('mission.observation_started', transition.mission, input);

    await this.missionRepository.save(transition.mission);
    await this.getObservationSessionRepository().start(session);
    await this.eventPublisher.publish(event);

    return { mission: transition.mission, session, event };
  }

  async completeObservation(input: MissionObservationTransitionInput): Promise<MissionObservationCompletionResult> {
    const mission = await this.loadMission(input.missionId);
    const activeSession = await this.getObservationSessionRepository().findActiveByMissionId(input.missionId);

    if (activeSession === undefined) {
      throw new MissionObservationSessionNotFoundError(input.missionId);
    }

    const transition = this.missionKernel.transition(mission, 'authorization', {
      ...(input.requestedAt !== undefined ? { occurredAt: input.requestedAt } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.causationId !== undefined ? { causationId: input.causationId } : {}),
    });
    const completedSession: MissionObservationSession = {
      ...activeSession,
      completedAt: transition.mission.updatedAt,
      durationMs: calculateDurationMs(activeSession.startedAt, transition.mission.updatedAt),
    };

    await this.missionRepository.save(transition.mission);
    await this.getObservationSessionRepository().complete(completedSession);
    await this.eventPublisher.publish(transition.event);

    return { mission: transition.mission, session: completedSession, event: transition.event };
  }

  private async loadMission(missionId: UUID): Promise<Mission> {
    const mission = await this.missionRepository.findById(missionId);

    if (mission === undefined) {
      throw new MissionNotFoundError(missionId);
    }

    return mission;
  }

  private getObservationSessionRepository(): MissionObservationSessionRepository {
    if (this.observationSessionRepository === undefined) {
      throw new MissionObservationSessionNotFoundError('observation-session-repository');
    }

    return this.observationSessionRepository;
  }

  private createMissionRecord(input: CreateMissionInput): Mission {
    const timestamp = input.requestedAt ?? this.options.now?.() ?? new Date().toISOString();

    return {
      id: this.options.createMissionId?.() ?? createMissionId(),
      ...(input.campaignId !== undefined ? { campaignId: input.campaignId } : {}),
      codename: input.codename,
      state: 'idle',
      ...(input.objective !== undefined ? { objective: input.objective } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private createMissionCreatedEvent(
    mission: Mission,
    input: CreateMissionInput,
  ): HQEvent<MissionCreatedPayload> {
    return createEventEnvelope({
      ...(this.options.createEventId !== undefined ? { id: this.options.createEventId() } : {}),
      type: 'mission.created',
      source: this.options.source ?? 'MissionService',
      occurredAt: mission.createdAt,
      missionId: mission.id,
      ...(mission.campaignId !== undefined ? { campaignId: mission.campaignId } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.causationId !== undefined ? { causationId: input.causationId } : {}),
      payload: {
        missionId: mission.id,
        ...(mission.campaignId !== undefined ? { campaignId: mission.campaignId } : {}),
        codename: mission.codename,
        ...(mission.objective !== undefined ? { objective: mission.objective } : {}),
      },
    });
  }

  private createMissionEvent<
    TType extends 'mission.briefing_started' | 'mission.briefing_completed' | 'mission.observation_started',
  >(
    type: TType,
    mission: Mission,
    input: MissionBriefingTransitionInput,
  ): HQEvent<EventPayloadMap[TType]> {
    return createEventEnvelope({
      type,
      source: this.options.source ?? 'MissionService',
      occurredAt: input.requestedAt ?? mission.updatedAt,
      missionId: mission.id,
      ...(mission.campaignId !== undefined ? { campaignId: mission.campaignId } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.causationId !== undefined ? { causationId: input.causationId } : {}),
      payload: {
        missionId: mission.id,
      },
    });
  }
}

export { InvalidMissionTransitionError };

function calculateDurationMs(startedAt: ISODateTime, completedAt: ISODateTime): number {
  return Date.parse(completedAt) - Date.parse(startedAt);
}

function createMissionId(): UUID {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (randomUUID) {
    return randomUUID.call(globalThis.crypto);
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (character) => {
    const value = (Number(character) ^ (Math.floor(Math.random() * 16) >> (Number(character) / 4)));
    return value.toString(16);
  });
}
