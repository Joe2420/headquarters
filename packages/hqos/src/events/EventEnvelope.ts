import type { EventPayloadMap, EventPriority, HeadquartersEventType, HQEvent, UUID } from '@headquarters/shared';
import {
  EVENT_IDS,
  EVENT_REGISTRY,
  getDefaultEventPriority,
  getEventSchemaVersion,
  isKnownEventType,
} from '@headquarters/shared';

export const HEADQUARTERS_EVENT_TYPES = EVENT_IDS;
export const EVENT_PRIORITIES = ['white', 'green', 'amber', 'red', 'black'] as const satisfies readonly EventPriority[];

export interface CreateEventEnvelopeInput<TType extends HeadquartersEventType> {
  type: TType;
  source: string;
  payload: EventPayloadMap[TType];
  id?: UUID;
  version?: number;
  occurredAt?: string;
  missionId?: UUID;
  campaignId?: UUID;
  correlationId?: UUID;
  causationId?: UUID;
  priority?: EventPriority;
}

export interface EventEnvelopeValidationResult {
  valid: boolean;
  errors: string[];
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const prioritySet = new Set<string>(EVENT_PRIORITIES);

export function createEventEnvelope<TType extends HeadquartersEventType>(
  input: CreateEventEnvelopeInput<TType>,
): HQEvent<EventPayloadMap[TType]> {
  const event: HQEvent<EventPayloadMap[TType]> = {
    id: input.id ?? createEventId(),
    type: input.type,
    version: input.version ?? getEventSchemaVersion(input.type),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    source: input.source,
    priority: input.priority ?? getDefaultEventPriority(input.type),
    payload: input.payload,
  };

  if (input.missionId !== undefined) event.missionId = input.missionId;
  if (input.campaignId !== undefined) event.campaignId = input.campaignId;
  if (input.correlationId !== undefined) event.correlationId = input.correlationId;
  if (input.causationId !== undefined) event.causationId = input.causationId;

  return event;
}

export function validateEventEnvelope(event: unknown): EventEnvelopeValidationResult {
  const errors: string[] = [];

  if (!isRecord(event)) {
    return { valid: false, errors: ['event must be an object'] };
  }

  validateUuidField(event, 'id', errors, true);

  if (typeof event.type !== 'string' || !isKnownEventType(event.type)) {
    errors.push('type must be a known Headquarters event type');
  }

  if (typeof event.version !== 'number' || !Number.isInteger(event.version) || event.version < 1) {
    errors.push('version must be a positive integer');
  }

  if (typeof event.occurredAt !== 'string' || Number.isNaN(Date.parse(event.occurredAt))) {
    errors.push('occurredAt must be an ISO timestamp string');
  }

  if (typeof event.source !== 'string' || event.source.length === 0) {
    errors.push('source must be a non-empty string');
  }

  if (typeof event.priority !== 'string' || !prioritySet.has(event.priority)) {
    errors.push('priority must be white, green, amber, red, or black');
  }

  if (!Object.hasOwn(event, 'payload')) {
    errors.push('payload is required');
  }

  if (typeof event.type === 'string' && isKnownEventType(event.type) && typeof event.version === 'number') {
    const expectedVersion = EVENT_REGISTRY[event.type].version;
    if (Number.isInteger(event.version) && event.version >= 1 && event.version !== expectedVersion) {
      errors.push(`version must match registry version ${expectedVersion}`);
    }
  }

  validateUuidField(event, 'missionId', errors, false);
  validateUuidField(event, 'campaignId', errors, false);
  validateUuidField(event, 'correlationId', errors, false);
  validateUuidField(event, 'causationId', errors, false);

  return { valid: errors.length === 0, errors };
}

export function isEventEnvelope<TType extends HeadquartersEventType = HeadquartersEventType>(
  event: unknown,
): event is HQEvent<EventPayloadMap[TType]> {
  return validateEventEnvelope(event).valid;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateUuidField(
  event: Record<string, unknown>,
  field: 'id' | 'missionId' | 'campaignId' | 'correlationId' | 'causationId',
  errors: string[],
  required: boolean,
): void {
  const value = event[field];

  if (value === undefined) {
    if (required) errors.push(`${field} is required`);
    return;
  }

  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    errors.push(`${field} must be a UUID`);
  }
}