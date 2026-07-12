CREATE TABLE IF NOT EXISTS institutional_health_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  evaluated_at TEXT NOT NULL,
  overall_state TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_institutional_health_snapshots_evaluated_at
  ON institutional_health_snapshots (evaluated_at);

CREATE TABLE IF NOT EXISTS institutional_health_history (
  history_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  dimension_id TEXT NOT NULL,
  old_state TEXT,
  new_state TEXT NOT NULL,
  cause TEXT NOT NULL,
  source_evidence_json TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES institutional_health_snapshots(snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_institutional_health_history_changed_at
  ON institutional_health_history (changed_at);
