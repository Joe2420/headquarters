import type { HeadquartersDatabase } from '@headquarters/database';
import type { RelationshipHistory, RelationshipSnapshot } from './CommanderRelationship';
import { buildCommanderRelationshipHistory } from './CommanderRelationshipHistory';

interface RelationshipSnapshotRow {
  snapshot_id: string;
  payload_json: string;
}

interface RelationshipHistoryRow {
  history_id: string;
  payload_json: string;
}

type DatabaseConnection = HeadquartersDatabase['connection'];

export class CommanderRelationshipRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  saveSnapshot(
    snapshot: RelationshipSnapshot,
    previousSnapshot?: RelationshipSnapshot | undefined,
  ): RelationshipSnapshot {
    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO commander_relationship_snapshots (
          snapshot_id,
          operator_id,
          evaluated_at,
          trust_state,
          coaching_mode,
          payload_json
        )
        VALUES (
          @snapshotId,
          @operatorId,
          @evaluatedAt,
          @trustState,
          @coachingMode,
          @payloadJson
        )
        ON CONFLICT(snapshot_id) DO UPDATE SET
          operator_id = excluded.operator_id,
          evaluated_at = excluded.evaluated_at,
          trust_state = excluded.trust_state,
          coaching_mode = excluded.coaching_mode,
          payload_json = excluded.payload_json
      `).run({
        snapshotId: snapshot.snapshotId,
        operatorId: snapshot.operatorId,
        evaluatedAt: snapshot.evaluatedAt,
        trustState: snapshot.relationship.trustState,
        coachingMode: snapshot.relationship.coachingMode,
        payloadJson: JSON.stringify(snapshot),
      });

      for (const entry of buildCommanderRelationshipHistory({ previousSnapshot, currentSnapshot: snapshot })) {
        this.saveHistoryEntry(entry);
      }
    });

    transaction();
    return snapshot;
  }

  getSnapshotById(snapshotId: string): RelationshipSnapshot | undefined {
    const row = this.db.prepare(`
      SELECT * FROM commander_relationship_snapshots
      WHERE snapshot_id = ?
    `).get(snapshotId) as RelationshipSnapshotRow | undefined;
    return row === undefined ? undefined : JSON.parse(row.payload_json) as RelationshipSnapshot;
  }

  getLatestSnapshot(operatorId = 'operator'): RelationshipSnapshot | undefined {
    const row = this.db.prepare(`
      SELECT * FROM commander_relationship_snapshots
      WHERE operator_id = ?
      ORDER BY evaluated_at DESC, snapshot_id DESC
      LIMIT 1
    `).get(operatorId) as RelationshipSnapshotRow | undefined;
    return row === undefined ? undefined : JSON.parse(row.payload_json) as RelationshipSnapshot;
  }

  listSnapshots(operatorId = 'operator'): RelationshipSnapshot[] {
    const rows = this.db.prepare(`
      SELECT * FROM commander_relationship_snapshots
      WHERE operator_id = ?
      ORDER BY evaluated_at ASC, snapshot_id ASC
    `).all(operatorId) as RelationshipSnapshotRow[];
    return rows.map((row) => JSON.parse(row.payload_json) as RelationshipSnapshot);
  }

  listHistory(operatorId = 'operator'): RelationshipHistory[] {
    const rows = this.db.prepare(`
      SELECT history.*
      FROM commander_relationship_history history
      INNER JOIN commander_relationship_snapshots snapshots
        ON snapshots.snapshot_id = history.snapshot_id
      WHERE snapshots.operator_id = ?
      ORDER BY history.changed_at ASC, history.history_id ASC
    `).all(operatorId) as RelationshipHistoryRow[];
    return rows.map((row) => JSON.parse(row.payload_json) as RelationshipHistory);
  }

  private saveHistoryEntry(entry: RelationshipHistory): void {
    this.db.prepare(`
      INSERT INTO commander_relationship_history (
        history_id,
        snapshot_id,
        dimension_id,
        old_state,
        new_state,
        cause,
        evidence_json,
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
        @evidenceJson,
        @changedAt,
        @payloadJson
      )
      ON CONFLICT(history_id) DO UPDATE SET
        old_state = excluded.old_state,
        new_state = excluded.new_state,
        cause = excluded.cause,
        evidence_json = excluded.evidence_json,
        changed_at = excluded.changed_at,
        payload_json = excluded.payload_json
    `).run({
      historyId: entry.historyId,
      snapshotId: entry.snapshotId,
      dimensionId: entry.dimensionId,
      oldState: entry.oldState ?? null,
      newState: entry.newState,
      cause: entry.cause,
      evidenceJson: JSON.stringify(entry.evidence),
      changedAt: entry.changedAt,
      payloadJson: JSON.stringify(entry),
    });
  }
}
