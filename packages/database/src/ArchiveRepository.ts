import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { EventPriority, HQEvent, HeadquartersEventType } from '@headquarters/shared';
import { HeadquartersDatabase } from './Database';

interface ArchiveEventRow {
  id: string;
  type: HeadquartersEventType;
  version: number;
  occurred_at: string;
  source: string;
  mission_id: string | null;
  campaign_id: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  priority: EventPriority;
  payload_json: string;
}

export class ArchiveRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  append(event: HQEvent): void {
    this.db.prepare(`
      INSERT INTO archive_events (
        id,
        type,
        version,
        occurred_at,
        source,
        mission_id,
        campaign_id,
        correlation_id,
        causation_id,
        priority,
        payload_json,
        envelope_json
      )
      VALUES (
        @id,
        @type,
        @version,
        @occurredAt,
        @source,
        @missionId,
        @campaignId,
        @correlationId,
        @causationId,
        @priority,
        @payloadJson,
        @envelopeJson
      )
    `).run({
      id: event.id,
      type: event.type,
      version: event.version,
      occurredAt: event.occurredAt,
      source: event.source,
      missionId: event.missionId ?? null,
      campaignId: event.campaignId ?? null,
      correlationId: event.correlationId ?? null,
      causationId: event.causationId ?? null,
      priority: event.priority,
      payloadJson: JSON.stringify(event.payload),
      envelopeJson: JSON.stringify(event),
    });
  }

  findById(id: string): HQEvent | undefined {
    const row = this.db.prepare('SELECT * FROM archive_events WHERE id = ?').get(id) as ArchiveEventRow | undefined;
    return row === undefined ? undefined : mapRowToEvent(row);
  }

  list(): HQEvent[] {
    const rows = this.db.prepare('SELECT * FROM archive_events ORDER BY append_order ASC').all() as ArchiveEventRow[];
    return rows.map(mapRowToEvent);
  }
}

function mapRowToEvent(row: ArchiveEventRow): HQEvent {
  return {
    id: row.id,
    type: row.type,
    version: row.version,
    occurredAt: row.occurred_at,
    source: row.source,
    priority: row.priority,
    payload: JSON.parse(row.payload_json) as unknown,
    ...(row.mission_id !== null ? { missionId: row.mission_id } : {}),
    ...(row.campaign_id !== null ? { campaignId: row.campaign_id } : {}),
    ...(row.correlation_id !== null ? { correlationId: row.correlation_id } : {}),
    ...(row.causation_id !== null ? { causationId: row.causation_id } : {}),
  };
}
