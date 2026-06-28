import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { ISODateTime, UUID } from '@headquarters/shared';
import { HeadquartersDatabase } from './Database';

export interface ObservationSessionRecord {
  readonly id: UUID;
  readonly missionId: UUID;
  readonly startedAt: ISODateTime;
  readonly completedAt?: ISODateTime;
  readonly durationMs?: number;
}

interface ObservationSessionRow {
  id: string;
  mission_id: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export class ObservationSessionRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  start(session: ObservationSessionRecord): void {
    this.db.prepare(`
      INSERT INTO mission_observation_sessions (
        id,
        mission_id,
        started_at,
        completed_at,
        duration_ms
      )
      VALUES (
        @id,
        @missionId,
        @startedAt,
        @completedAt,
        @durationMs
      )
    `).run({
      id: session.id,
      missionId: session.missionId,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? null,
      durationMs: session.durationMs ?? null,
    });
  }

  complete(session: ObservationSessionRecord): void {
    this.db.prepare(`
      UPDATE mission_observation_sessions
      SET
        completed_at = @completedAt,
        duration_ms = @durationMs
      WHERE id = @id
    `).run({
      id: session.id,
      completedAt: session.completedAt ?? null,
      durationMs: session.durationMs ?? null,
    });
  }

  findActiveByMissionId(missionId: UUID): ObservationSessionRecord | undefined {
    const row = this.db.prepare(`
      SELECT *
      FROM mission_observation_sessions
      WHERE mission_id = ? AND completed_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `).get(missionId) as ObservationSessionRow | undefined;

    return row === undefined ? undefined : mapRowToSession(row);
  }

  findById(id: UUID): ObservationSessionRecord | undefined {
    const row = this.db.prepare('SELECT * FROM mission_observation_sessions WHERE id = ?').get(id) as
      | ObservationSessionRow
      | undefined;

    return row === undefined ? undefined : mapRowToSession(row);
  }
}

function mapRowToSession(row: ObservationSessionRow): ObservationSessionRecord {
  return {
    id: row.id,
    missionId: row.mission_id,
    startedAt: row.started_at,
    ...(row.completed_at !== null ? { completedAt: row.completed_at } : {}),
    ...(row.duration_ms !== null ? { durationMs: row.duration_ms } : {}),
  };
}
