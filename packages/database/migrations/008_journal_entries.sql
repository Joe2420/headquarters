CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  raw_mood TEXT,
  raw_market_conditions TEXT,
  source TEXT NOT NULL,
  attachment_references_json TEXT NOT NULL,
  classification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date, created_at);
