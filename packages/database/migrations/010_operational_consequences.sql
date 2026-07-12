CREATE TABLE IF NOT EXISTS operational_consequences (
  consequence_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  status TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_operational_consequences_mission
  ON operational_consequences (mission_id, created_at);

CREATE INDEX IF NOT EXISTS idx_operational_consequences_status
  ON operational_consequences (status, severity);
