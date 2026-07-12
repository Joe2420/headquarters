import type { HeadquartersDatabase } from '@headquarters/database';
import {
  completeRecoveryRequirement,
  createOperationalConsequence,
  isOperationalConsequenceBlocking,
  resolveOperationalConsequence as resolveConsequenceRecord,
  type OperationalConsequence,
  type OperationalConsequenceInput,
  type OperationalConsequenceStatus,
  type OperationalEvidenceReference,
} from './OperationalConsequence';

interface OperationalConsequenceRow {
  consequence_id: string;
  mission_id: string;
  status: string;
  severity: string;
  category: string;
  type: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
}

type DatabaseConnection = HeadquartersDatabase['connection'];

export class OperationalConsequenceRepository {
  private readonly db: DatabaseConnection;

  constructor(database: HeadquartersDatabase) {
    this.db = database.connection;
  }

  saveConsequence(consequence: OperationalConsequence): OperationalConsequence {
    this.upsert(consequence, consequence.createdAt);
    return consequence;
  }

  updateConsequenceStatus(
    consequenceId: string,
    status: OperationalConsequenceStatus,
    updatedAt: string,
  ): OperationalConsequence {
    const current = this.requireConsequence(consequenceId);
    const updated = createOperationalConsequence({
      ...toInput(current),
      status,
      ...(status === 'resolved' || status === 'expired' || status === 'superseded' ? { resolvedAt: updatedAt } : {}),
    });
    this.upsert(updated, updatedAt);
    return updated;
  }

  recordRecoveryProgress(
    consequenceId: string,
    requirementId: string,
    input: {
      readonly completedAt: string;
      readonly evidenceReferences?: readonly OperationalEvidenceReference[] | undefined;
    },
  ): OperationalConsequence {
    const current = this.requireConsequence(consequenceId);
    const updated = completeRecoveryRequirement(current, {
      requirementId,
      completedAt: input.completedAt,
      evidenceReferences: input.evidenceReferences,
    });
    this.upsert(updated, input.completedAt);
    return updated;
  }

  resolveConsequence(
    consequenceId: string,
    input: {
      readonly resolvedAt: string;
      readonly resolutionEvidence: readonly OperationalEvidenceReference[];
    },
  ): OperationalConsequence {
    const current = this.requireConsequence(consequenceId);
    const updated = resolveConsequenceRecord(current, input);
    this.upsert(updated, input.resolvedAt);
    return updated;
  }

  getConsequenceById(consequenceId: string): OperationalConsequence | undefined {
    const row = this.db.prepare('SELECT * FROM operational_consequences WHERE consequence_id = ?').get(consequenceId) as OperationalConsequenceRow | undefined;
    return row === undefined ? undefined : mapRow(row);
  }

  listConsequencesForMission(missionId: string): OperationalConsequence[] {
    return this.listWhere('mission_id = ?', [missionId]);
  }

  listActiveConsequences(): OperationalConsequence[] {
    return this.listWhere("status IN ('pending', 'active', 'recovering')", []);
  }

  listBlockingConsequences(): OperationalConsequence[] {
    return this.listActiveConsequences().filter(isOperationalConsequenceBlocking);
  }

  listHistoricalConsequences(): OperationalConsequence[] {
    return this.listWhere("status NOT IN ('pending', 'active', 'recovering')", []);
  }

  private requireConsequence(consequenceId: string): OperationalConsequence {
    const consequence = this.getConsequenceById(consequenceId);
    if (consequence === undefined) {
      throw new Error(`Operational consequence ${consequenceId} does not exist.`);
    }
    return consequence;
  }

  private upsert(consequence: OperationalConsequence, updatedAt: string): void {
    this.db.prepare(`
      INSERT INTO operational_consequences (
        consequence_id,
        mission_id,
        status,
        severity,
        category,
        type,
        payload_json,
        created_at,
        updated_at
      )
      VALUES (
        @consequenceId,
        @missionId,
        @status,
        @severity,
        @category,
        @type,
        @payloadJson,
        @createdAt,
        @updatedAt
      )
      ON CONFLICT(consequence_id) DO UPDATE SET
        mission_id = excluded.mission_id,
        status = excluded.status,
        severity = excluded.severity,
        category = excluded.category,
        type = excluded.type,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).run({
      consequenceId: consequence.consequenceId,
      missionId: consequence.missionId,
      status: consequence.status,
      severity: consequence.severity,
      category: consequence.category,
      type: consequence.type,
      payloadJson: JSON.stringify(consequence),
      createdAt: consequence.createdAt,
      updatedAt,
    });
  }

  private listWhere(where: string, params: readonly unknown[]): OperationalConsequence[] {
    const rows = this.db.prepare(`
      SELECT * FROM operational_consequences
      WHERE ${where}
      ORDER BY created_at ASC, consequence_id ASC
    `).all(...params) as OperationalConsequenceRow[];
    return rows.map(mapRow);
  }
}

function mapRow(row: OperationalConsequenceRow): OperationalConsequence {
  return createOperationalConsequence(JSON.parse(row.payload_json) as OperationalConsequenceInput);
}

function toInput(consequence: OperationalConsequence): OperationalConsequenceInput {
  return {
    ...consequence,
    recoveryRequirements: consequence.recoveryRequirements,
    resolutionEvidence: consequence.resolutionEvidence,
  };
}
