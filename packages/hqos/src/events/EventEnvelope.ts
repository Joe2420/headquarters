import type { EventPriority, HeadquartersEventType, HQEvent, UUID } from '@headquarters/shared';

export const HEADQUARTERS_EVENT_TYPES = [
  'system.boot.completed',
  'hq.boot.started',
  'hq.boot.completed',
  'hq.shutdown.requested',
  'mission.created',
  'mission.briefing_started',
  'mission.briefing_completed',
  'mission.observation_started',
  'mission.authorization_requested',
  'mission.authorized',
  'mission.authorization_denied',
  'mission.deployment_declared',
  'mission.objective_achieved',
  'mission.return_to_base_requested',
  'mission.completed',
  'mission.debrief_started',
  'mission.debrief_completed',
  'mission.archived',
  'mission.state.changed',
  'operator.command_assumed',
  'operator.command_released',
  'operator.identity_snapshot_recorded',
  'operator.identity_drift_detected',
  'operator.judgment_reserve_changed',
  'operator.readiness_report_submitted',
  'operator.recovery_window_started',
  'operator.recovery_window_completed',
  'guardian.protocol_activated',
  'guardian.intervention_recommended',
  'guardian.vault_secured',
  'guardian.unlock_requested',
  'guardian.success_protocol_activated',
  'guardian.capital_integrity_changed',
  'archive.artifact_written',
  'archive.campaign_book_updated',
  'archive.doctrine_snapshot_saved',
  'archive.black_box_closed',
  'environment.room_entered',
  'environment.lighting_profile_changed',
  'environment.audio_profile_changed',
  'environment.transition_started',
  'environment.transition_completed',
] as const satisfies readonly HeadquartersEventType[];

export const EVENT_PRIORITIES = ['white', 'green', 'amber', 'red', 'black'] as const satisfies readonly EventPriority[];

export interface CreateEventEnvelopeInput<TPayload> {
  type: HeadquartersEventType;
  source: string;
  payload: TPayload;
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
const eventTypeSet = new Set<string>(HEADQUARTERS_EVENT_TYPES);
const prioritySet = new Set<string>(EVENT_PRIORITIES);

export function createEventEnvelope<TPayload>(input: CreateEventEnvelopeInput<TPayload>): HQEvent<TPayload> {
  const event: HQEvent<TPayload> = {
    id: input.id ?? createEventId(),
    type: input.type,
    version: input.version ?? 1,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    source: input.source,
    priority: input.priority ?? 'white',
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

  if (typeof event.type !== 'string' || !eventTypeSet.has(event.type)) {
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

  validateUuidField(event, 'missionId', errors, false);
  validateUuidField(event, 'campaignId', errors, false);
  validateUuidField(event, 'correlationId', errors, false);
  validateUuidField(event, 'causationId', errors, false);

  return { valid: errors.length === 0, errors };
}

export function isEventEnvelope<TPayload = unknown>(event: unknown): event is HQEvent<TPayload> {
  return validateEventEnvelope(event).valid;
}

function createEventId(): UUID {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (randomUUID) {
    return randomUUID.call(globalThis.crypto);
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (character) => {
    const value = Number(character) ^ Math.floor(Math.random() * 16) >> Number(character) / 4;
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