import type { Database as DatabaseConnection } from 'better-sqlite3';
import { HeadquartersDatabase } from './Database';

export interface MissionContextRecord {
  readonly missionId: string;
  readonly contextJson: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface MissionContextRow {
  mission_id: string;
  context_json: string;
  created_at: string;
  updated_at: string;
}

export class MissionContextRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  save(record: MissionContextRecord): MissionContextRecord {
    this.db.prepare(`
      INSERT INTO mission_context_records (
        mission_id,
        context_json,
        created_at,
        updated_at
      )
      VALUES (
        @missionId,
        @contextJson,
        @createdAt,
        @updatedAt
      )
      ON CONFLICT(mission_id) DO UPDATE SET
        context_json = excluded.context_json,
        updated_at = excluded.updated_at
    `).run(record);

    return record;
  }

  findByMissionId(missionId: string): MissionContextRecord | undefined {
    const row = this.db.prepare('SELECT * FROM mission_context_records WHERE mission_id = ?').get(missionId) as MissionContextRow | undefined;
    return row === undefined ? undefined : mapRow(row);
  }

  list(): MissionContextRecord[] {
    const rows = this.db.prepare('SELECT * FROM mission_context_records ORDER BY updated_at ASC, mission_id ASC').all() as MissionContextRow[];
    return rows.map(mapRow);
  }
}

function mapRow(row: MissionContextRow): MissionContextRecord {
  return {
    missionId: row.mission_id,
    contextJson: row.context_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

