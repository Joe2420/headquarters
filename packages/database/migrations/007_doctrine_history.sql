CREATE TABLE IF NOT EXISTS doctrine_history (
  id TEXT PRIMARY KEY,
  doctrine_id TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (doctrine_id) REFERENCES doctrine_records(id)
);

CREATE INDEX IF NOT EXISTS idx_doctrine_history_occurred_at
  ON doctrine_history(occurred_at);

CREATE INDEX IF NOT EXISTS idx_doctrine_history_doctrine_id
  ON doctrine_history(doctrine_id);
