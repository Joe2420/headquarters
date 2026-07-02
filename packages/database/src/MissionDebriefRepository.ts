import type { Database as DatabaseConnection } from 'better-sqlite3';
import type { ISODateTime, UUID } from '@headquarters/shared';
import { HeadquartersDatabase } from './Database';

export interface MissionDebriefRecord {
  readonly id: UUID;
  readonly missionId: UUID;
  readonly behaviorSummary: string;
  readonly disciplineNotes: string;
  readonly lesson: string;
  readonly createdAt: ISODateTime;
}

interface MissionDebriefRow {
  id: string;
  mission_id: string;
  behavior_summary: string;
  discipline_notes: string;
  lesson: string;
  created_at: string;
}

export class MissionDebriefRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  save(debrief: MissionDebriefRecord): void {
    this.db.prepare(`
      INSERT INTO mission_debriefs (
        id,
        mission_id,
        behavior_summary,
        discipline_notes,
        lesson,
        created_at
      )
      VALUES (
        @id,
        @missionId,
        @behaviorSummary,
        @disciplineNotes,
        @lesson,
        @createdAt
      )
      ON CONFLICT(mission_id) DO UPDATE SET
        behavior_summary = excluded.behavior_summary,
        discipline_notes = excluded.discipline_notes,
        lesson = excluded.lesson,
        created_at = excluded.created_at
    `).run({
      id: debrief.id,
      missionId: debrief.missionId,
      behaviorSummary: debrief.behaviorSummary,
      disciplineNotes: debrief.disciplineNotes,
      lesson: debrief.lesson,
      createdAt: debrief.createdAt,
    });
  }

  findByMissionId(missionId: UUID): MissionDebriefRecord | undefined {
    const row = this.db.prepare('SELECT * FROM mission_debriefs WHERE mission_id = ?').get(missionId) as
      | MissionDebriefRow
      | undefined;

    return row === undefined ? undefined : mapRowToDebrief(row);
  }

  list(): MissionDebriefRecord[] {
    const rows = this.db.prepare('SELECT * FROM mission_debriefs ORDER BY created_at ASC, id ASC').all() as MissionDebriefRow[];
    return rows.map(mapRowToDebrief);
  }
}

function mapRowToDebrief(row: MissionDebriefRow): MissionDebriefRecord {
  return {
    id: row.id,
    missionId: row.mission_id,
    behaviorSummary: row.behavior_summary,
    disciplineNotes: row.discipline_notes,
    lesson: row.lesson,
    createdAt: row.created_at,
  };
}
