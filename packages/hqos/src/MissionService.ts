import type { HQEvent, Mission, MissionCreatedPayload, UUID } from '@headquarters/shared';
import { createEventEnvelope } from './events';

export interface CreateMissionInput {
  readonly codename: string;
  readonly campaignId?: UUID;
  readonly objective?: string;
  readonly requestedAt?: string;
  readonly correlationId?: UUID;
  readonly causationId?: UUID;
}

export interface MissionRecordRepository {
  save(mission: Mission): Promise<void> | void;
}

export interface MissionCreatedEventPublisher {
  publish(event: HQEvent<MissionCreatedPayload>): Promise<void> | void;
}

export interface MissionServiceOptions {
  readonly now?: () => string;
  readonly createMissionId?: () => UUID;
  readonly createEventId?: () => UUID;
  readonly source?: string;
}

export interface MissionCreationResult {
  readonly mission: Mission;
  readonly event: HQEvent<MissionCreatedPayload>;
}

export class MissionService {
  constructor(
    private readonly missionRepository: MissionRecordRepository,
    private readonly eventPublisher: MissionCreatedEventPublisher,
    private readonly options: MissionServiceOptions = {},
  ) {}

  async createMission(input: CreateMissionInput): Promise<MissionCreationResult> {
    const mission = this.createMissionRecord(input);
    const event = this.createMissionCreatedEvent(mission, input);

    await this.missionRepository.save(mission);
    await this.eventPublisher.publish(event);

    return { mission, event };
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
