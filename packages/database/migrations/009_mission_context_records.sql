CREATE TABLE IF NOT EXISTS mission_context_records (
  mission_id TEXT PRIMARY KEY,
  context_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);

