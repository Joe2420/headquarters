-- Headquarters HTB v0.2 Initial SQLite Migration
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS operator_profile (
  id TEXT PRIMARY KEY,
  callsign TEXT NOT NULL,
  display_name TEXT,
  primary_theater TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  codename TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('planned','active','paused','completed','archived')),
  start_date TEXT,
  end_date TEXT,
  integrity_score REAL DEFAULT 100,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  codename TEXT NOT NULL,
  theater TEXT,
  asset TEXT,
  mission_mode TEXT CHECK(mission_mode IN ('training','funded','research','simulation')),
  status TEXT NOT NULL CHECK(status IN ('created','briefing','ready','observation','authorization','deployed','management','return_to_base','debrief','archived','closed','suspended')),
  objective TEXT,
  command_authority TEXT,
  mission_integrity REAL DEFAULT 100,
  guardian_integrity REAL DEFAULT 100,
  started_at TEXT,
  ended_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mission_events (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('white','green','amber','red','black')) DEFAULT 'white',
  payload_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mission_events_mission_time ON mission_events(mission_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_mission_events_type ON mission_events(event_type);

CREATE TABLE IF NOT EXISTS behavior_events (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  category TEXT NOT NULL,
  signal_name TEXT NOT NULL,
  value REAL,
  confidence REAL,
  payload_json TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_behavior_events_mission_time ON behavior_events(mission_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_behavior_events_signal ON behavior_events(signal_name);

CREATE TABLE IF NOT EXISTS identity_snapshots (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  professional_alignment REAL NOT NULL,
  identity_label TEXT NOT NULL,
  identity_drift REAL NOT NULL,
  command_authority TEXT,
  evidence_json TEXT,
  captured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guardian_interventions (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  intervention_type TEXT NOT NULL,
  trigger_event_id TEXT REFERENCES mission_events(id),
  recommendation TEXT NOT NULL,
  confidence REAL NOT NULL,
  accepted INTEGER,
  result_summary TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctrine_rules (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  level TEXT CHECK(level IN ('observation','hypothesis','field_test','validated','doctrine','foundational')),
  confidence REAL DEFAULT 0,
  status TEXT CHECK(status IN ('active','retired','candidate','superseded')),
  evidence_count INTEGER DEFAULT 0,
  created_after_mission_id TEXT REFERENCES missions(id),
  retired_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctrine_applications (
  id TEXT PRIMARY KEY,
  doctrine_id TEXT REFERENCES doctrine_rules(id),
  mission_id TEXT REFERENCES missions(id),
  decision_id TEXT,
  application_status TEXT CHECK(application_status IN ('applied','ignored','not_applicable','overridden')),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  decision_type TEXT NOT NULL,
  description TEXT NOT NULL,
  decision_quality REAL,
  decision_weight TEXT CHECK(decision_weight IN ('low','medium','high','critical')),
  outcome_label TEXT,
  evidence_json TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debriefs (
  id TEXT PRIMARY KEY,
  mission_id TEXT UNIQUE REFERENCES missions(id),
  operator_notes TEXT,
  commander_assessment TEXT,
  guardian_assessment TEXT,
  historian_assessment TEXT,
  internal_affairs_status TEXT,
  honesty_confidence REAL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS archive_artifacts (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  artifact_type TEXT CHECK(artifact_type IN ('mission_report','behavior_report','decision_report','intelligence_report','doctrine_report','black_box','campaign_book','legacy_record')),
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  importance INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recognition_records (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  recognition_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  awarded_for TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  department TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence REAL NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  accepted INTEGER,
  outcome_review TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
