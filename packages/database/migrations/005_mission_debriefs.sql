CREATE TABLE IF NOT EXISTS mission_debriefs (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL UNIQUE,
  behavior_summary TEXT NOT NULL,
  discipline_notes TEXT NOT NULL,
  lesson TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);
