CREATE TABLE IF NOT EXISTS commander_relationship_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  trust_state TEXT NOT NULL,
  coaching_mode TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commander_relationship_snapshots_operator_evaluated
  ON commander_relationship_snapshots (operator_id, evaluated_at);

CREATE TABLE IF NOT EXISTS commander_relationship_history (
  history_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  dimension_id TEXT NOT NULL,
  old_state TEXT,
  new_state TEXT NOT NULL,
  cause TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES commander_relationship_snapshots(snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_commander_relationship_history_changed_at
  ON commander_relationship_history (changed_at);
