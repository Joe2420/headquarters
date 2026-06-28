CREATE TABLE IF NOT EXISTS mission_observation_sessions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE INDEX IF NOT EXISTS idx_observation_sessions_mission_active
ON mission_observation_sessions(mission_id, completed_at);
