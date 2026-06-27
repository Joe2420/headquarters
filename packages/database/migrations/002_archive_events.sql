CREATE TABLE IF NOT EXISTS archive_events (
  append_order INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  version INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  source TEXT NOT NULL,
  mission_id TEXT,
  campaign_id TEXT,
  correlation_id TEXT,
  causation_id TEXT,
  priority TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  envelope_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_archive_events_type_order ON archive_events(type, append_order);
CREATE INDEX IF NOT EXISTS idx_archive_events_mission_order ON archive_events(mission_id, append_order);
