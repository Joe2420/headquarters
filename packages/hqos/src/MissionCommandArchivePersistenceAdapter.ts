import type { ArchiveRepository } from '@headquarters/database';
import type { HQEvent, UUID } from '@headquarters/shared';
import {
  getDefaultEventPriority,
  getEventSchemaVersion,
} from '@headquarters/shared';
import type { MissionCommandExecutionResult } from './MissionCommandExecutionHandler';
import type {
  MissionCommandPersistencePort,
  MissionCommandPersistenceRequest,
  MissionCommandPersistenceResult,
} from './MissionCommandPersistencePort';
import type { MissionCommandResultEventTypeCandidate } from './MissionCommandResultEvents';

export interface MissionCommandArchivePersistenceAdapterOptions {
  readonly source?: string;
  readonly now?: () => string;
  readonly createEventId?: () => UUID;
}

type MissionCommandArchiveRepository = Pick<ArchiveRepository, 'append'>;

export class MissionCommandArchivePersistenceAdapter
  implements MissionCommandPersistencePort<MissionCommandExecutionResult> {
  constructor(
    private readonly archiveRepository: MissionCommandArchiveRepository,
    private readonly options: MissionCommandArchivePersistenceAdapterOptions = {},
  ) {}

  appendCommandResultEventCandidate(
    request: MissionCommandPersistenceRequest<MissionCommandExecutionResult>,
  ): MissionCommandPersistenceResult {
    const event = this.toArchiveEvent(request);
    this.archiveRepository.append(event);

    return {
      ok: true,
      ...(request.commandId !== undefined ? { commandId: request.commandId } : {}),
      eventType: request.eventCandidate.type,
    };
  }

  private toArchiveEvent(
    request: MissionCommandPersistenceRequest<MissionCommandExecutionResult>,
  ): HQEvent {
    const type = request.eventCandidate.type;

    return {
      id: this.options.createEventId?.() ?? createEventId(),
      type,
      version: getEventSchemaVersion(type),
      occurredAt: this.options.now?.() ?? new Date().toISOString(),
      source: this.options.source ?? 'MissionCommandArchivePersistenceAdapter',
      priority: getDefaultEventPriority(type),
      payload: request.eventCandidate.payload,
      ...(request.commandId !== undefined ? { correlationId: request.commandId } : {}),
    };
  }
}

function createEventId(): UUID {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (randomUUID) {
    return randomUUID.call(globalThis.crypto);
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (character) => {
    const value = (Number(character) ^ (Math.floor(Math.random() * 16) >> (Number(character) / 4)));
    return value.toString(16);
  });
}

export function isMissionCommandResultEventType(
  value: string,
): value is MissionCommandResultEventTypeCandidate {
  return value === 'mission.command.succeeded' || value === 'mission.command.failed';
}
