import type { HeadquartersDatabase } from '@headquarters/database';
import type { InstitutionalHealthHistoryEntry } from './InstitutionalHealthHistory';
import { buildInstitutionalHealthHistory } from './InstitutionalHealthHistory';
import type { InstitutionalHealthSnapshot } from './InstitutionalHealth';

interface InstitutionalHealthSnapshotRow {
  snapshot_id: string;
  evaluated_at: string;
  overall_state: string;
  payload_json: string;
}

interface InstitutionalHealthHistoryRow {
  history_id: string;
  payload_json: string;
}

type DatabaseConnection = HeadquartersDatabase['connection'];

export class InstitutionalHealthRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  saveSnapshot(
    snapshot: InstitutionalHealthSnapshot,
    previousSnapshot?: InstitutionalHealthSnapshot | undefined,
  ): InstitutionalHealthSnapshot {
    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO institutional_health_snapshots (
          snapshot_id,
          evaluated_at,
          overall_state,
          payload_json
        )
        VALUES (
          @snapshotId,
          @evaluatedAt,
          @overallState,
          @payloadJson
        )
        ON CONFLICT(snapshot_id) DO UPDATE SET
          evaluated_at = excluded.evaluated_at,
          overall_state = excluded.overall_state,
          payload_json = excluded.payload_json
      `).run({
        snapshotId: snapshot.snapshotId,
        evaluatedAt: snapshot.evaluatedAt,
        overallState: snapshot.overallState,
        payloadJson: JSON.stringify(snapshot),
      });

      for (const entry of buildInstitutionalHealthHistory({ previousSnapshot, currentSnapshot: snapshot })) {
        this.saveHistoryEntry(entry);
      }
    });

    transaction();
    return snapshot;
  }

  getSnapshotById(snapshotId: string): InstitutionalHealthSnapshot | undefined {
    const row = this.db.prepare(`
      SELECT * FROM institutional_health_snapshots
      WHERE snapshot_id = ?
    `).get(snapshotId) as InstitutionalHealthSnapshotRow | undefined;
    return row === undefined ? undefined : JSON.parse(row.payload_json) as InstitutionalHealthSnapshot;
  }

  getLatestSnapshot(): InstitutionalHealthSnapshot | undefined {
    const row = this.db.prepare(`
      SELECT * FROM institutional_health_snapshots
      ORDER BY evaluated_at DESC, snapshot_id DESC
      LIMIT 1
    `).get() as InstitutionalHealthSnapshotRow | undefined;
    return row === undefined ? undefined : JSON.parse(row.payload_json) as InstitutionalHealthSnapshot;
  }

  listSnapshots(): InstitutionalHealthSnapshot[] {
    const rows = this.db.prepare(`
      SELECT * FROM institutional_health_snapshots
      ORDER BY evaluated_at ASC, snapshot_id ASC
    `).all() as InstitutionalHealthSnapshotRow[];
    return rows.map((row) => JSON.parse(row.payload_json) as InstitutionalHealthSnapshot);
  }

  listHistory(): InstitutionalHealthHistoryEntry[] {
    const rows = this.db.prepare(`
      SELECT * FROM institutional_health_history
      ORDER BY changed_at ASC, history_id ASC
    `).all() as InstitutionalHealthHistoryRow[];
    return rows.map((row) => JSON.parse(row.payload_json) as InstitutionalHealthHistoryEntry);
  }

  private saveHistoryEntry(entry: InstitutionalHealthHistoryEntry): void {
    this.db.prepare(`
      INSERT INTO institutional_health_history (
        history_id,
        snapshot_id,
        dimension_id,
        old_state,
        new_state,
        cause,
        source_evidence_json,
        changed_at,
        payload_json
      )
      VALUES (
        @historyId,
        @snapshotId,
        @dimensionId,
        @oldState,
        @newState,
        @cause,
        @sourceEvidenceJson,
        @changedAt,
        @payloadJson
      )
      ON CONFLICT(history_id) DO UPDATE SET
        old_state = excluded.old_state,
        new_state = excluded.new_state,
        cause = excluded.cause,
        source_evidence_json = excluded.source_evidence_json,
        changed_at = excluded.changed_at,
        payload_json = excluded.payload_json
    `).run({
      historyId: entry.historyId,
      snapshotId: entry.snapshotId,
      dimensionId: entry.dimensionId,
      oldState: entry.oldState ?? null,
      newState: entry.newState,
      cause: entry.cause,
      sourceEvidenceJson: JSON.stringify(entry.sourceEvidence),
      changedAt: entry.changedAt,
      payloadJson: JSON.stringify(entry),
    });
  }
}
