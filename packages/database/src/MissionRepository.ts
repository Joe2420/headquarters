import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { Mission, MissionState } from '@headquarters/shared';
import { HeadquartersDatabase } from './Database';

interface MissionRow {
  id: string;
  campaign_id: string | null;
  codename: string;
  state: MissionState;
  objective: string | null;
  created_at: string;
  updated_at: string;
}

export class MissionRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  save(mission: Mission): void {
    this.db.prepare(`
      INSERT INTO missions (
        id,
        campaign_id,
        codename,
        state,
        objective,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @campaignId,
        @codename,
        @state,
        @objective,
        @createdAt,
        @updatedAt
      )
    `).run({
      id: mission.id,
      campaignId: mission.campaignId ?? null,
      codename: mission.codename,
      state: mission.state,
      objective: mission.objective ?? null,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
    });
  }

  findById(id: string): Mission | undefined {
    const row = this.db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as MissionRow | undefined;
    return row === undefined ? undefined : mapRowToMission(row);
  }
}

function mapRowToMission(row: MissionRow): Mission {
  return {
    id: row.id,
    ...(row.campaign_id !== null ? { campaignId: row.campaign_id } : {}),
    codename: row.codename,
    state: row.state,
    ...(row.objective !== null ? { objective: row.objective } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
