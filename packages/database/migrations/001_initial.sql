CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  codename TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  correlation_id TEXT
);

CREATE TABLE IF NOT EXISTS operator_snapshots (
  id TEXT PRIMARY KEY,
  mission_id TEXT,
  captured_at TEXT NOT NULL,
  identity TEXT NOT NULL,
  professional_alignment REAL NOT NULL,
  mental_noise REAL NOT NULL,
  judgment_reserve REAL NOT NULL,
  command_stability REAL NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(type, timestamp);
CREATE INDEX IF NOT EXISTS idx_operator_snapshots_mission ON operator_snapshots(mission_id, captured_at);

INSERT OR IGNORE INTO schema_migrations (version, applied_at)
VALUES ('001_initial', datetime('now'));
