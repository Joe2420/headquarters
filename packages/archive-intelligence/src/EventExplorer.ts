import type { EventEnvelope } from '@headquarters/shared';

export interface ArchiveEventInspection {
  readonly id: string;
  readonly type: EventEnvelope['type'];
  readonly occurredAt: string;
  readonly source: EventEnvelope['source'];
  readonly priority: EventEnvelope['priority'];
  readonly missionId?: string;
  readonly payloadPreview: string;
}

export function inspectArchiveEvents(events: readonly EventEnvelope[]): readonly ArchiveEventInspection[] {
  return events.map((event) => ({
    id: event.id,
    type: event.type,
    occurredAt: event.occurredAt,
    source: event.source,
    priority: event.priority,
    ...(event.missionId !== undefined ? { missionId: event.missionId } : {}),
    payloadPreview: safePayloadPreview(event.payload),
  }));
}

function safePayloadPreview(payload: unknown): string {
  if (payload === null) return 'null';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload);
  if (Array.isArray(payload)) return `${payload.length} array item${payload.length === 1 ? '' : 's'}`;
  if (typeof payload === 'object') return Object.keys(payload).sort().join(', ') || 'empty object';
  return 'unavailable payload';
}
