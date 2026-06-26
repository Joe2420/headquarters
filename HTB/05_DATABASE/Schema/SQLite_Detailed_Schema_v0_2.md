# SQLite Detailed Schema v0.2

Classification: Technical  
Owner: Historian / Engineering  
Status: Engineering Draft

## Purpose
Defines the first implementation-ready local database schema for Headquarters.

SQLite is not treated as generic storage. It is the Archives. Every table must preserve institutional memory, operational state, doctrine, or evidence required for later intelligence.

## Core Design Rules
- Local-first. No external server required for v1.
- Append-only where possible for mission events and behavior events.
- Never delete mission history. Use `archived_at`, `retired_at`, or `superseded_by`.
- Every significant record has `created_at` and `updated_at`.
- Every operational record can be traced to a mission, campaign, doctrine, or system event.
- AI conclusions must cite source evidence IDs.

## Tables

### operator_profile
Stores the local Operator identity.

Columns:
- id TEXT PRIMARY KEY
- callsign TEXT NOT NULL
- display_name TEXT
- primary_theater TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

### campaigns
Represents multi-week or multi-month operational objectives.

Columns:
- id TEXT PRIMARY KEY
- codename TEXT NOT NULL
- objective TEXT NOT NULL
- status TEXT NOT NULL CHECK(status IN ('planned','active','paused','completed','archived'))
- start_date TEXT
- end_date TEXT
- integrity_score REAL DEFAULT 100
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

### missions
Represents one operational trading session/day.

Columns:
- id TEXT PRIMARY KEY
- campaign_id TEXT REFERENCES campaigns(id)
- codename TEXT NOT NULL
- theater TEXT
- asset TEXT
- mission_mode TEXT CHECK(mission_mode IN ('training','funded','research','simulation'))
- status TEXT NOT NULL CHECK(status IN ('created','briefing','ready','observation','authorization','deployed','management','return_to_base','debrief','archived','closed','suspended'))
- objective TEXT
- command_authority TEXT
- mission_integrity REAL DEFAULT 100
- guardian_integrity REAL DEFAULT 100
- started_at TEXT
- ended_at TEXT
- archived_at TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

### mission_events
Append-only operational timeline.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT NOT NULL REFERENCES missions(id)
- event_type TEXT NOT NULL
- event_source TEXT NOT NULL
- severity TEXT CHECK(severity IN ('white','green','amber','red','black')) DEFAULT 'white'
- payload_json TEXT NOT NULL
- occurred_at TEXT NOT NULL
- created_at TEXT NOT NULL

Indexes:
- idx_mission_events_mission_time(mission_id, occurred_at)
- idx_mission_events_type(event_type)

### behavior_events
Append-only behavioral telemetry.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- category TEXT NOT NULL
- signal_name TEXT NOT NULL
- value REAL
- confidence REAL
- payload_json TEXT
- occurred_at TEXT NOT NULL
- created_at TEXT NOT NULL

Examples:
- mouse_velocity_spike
- chart_switch_count
- authorization_override_attempt
- uncertain_language_detected
- recovery_window_accepted

### identity_snapshots
Stores periodic Command Chair state.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- professional_alignment REAL NOT NULL
- identity_label TEXT NOT NULL
- identity_drift REAL NOT NULL
- command_authority TEXT
- evidence_json TEXT
- captured_at TEXT NOT NULL

### guardian_interventions
Records Guardian, Sentinel, or Success Protocol interventions.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- intervention_type TEXT NOT NULL
- trigger_event_id TEXT REFERENCES mission_events(id)
- recommendation TEXT NOT NULL
- confidence REAL NOT NULL
- accepted INTEGER
- result_summary TEXT
- created_at TEXT NOT NULL

### doctrine_rules
Stores active, retired, and candidate doctrines.

Columns:
- id TEXT PRIMARY KEY
- code TEXT UNIQUE NOT NULL
- title TEXT NOT NULL
- body TEXT NOT NULL
- level TEXT CHECK(level IN ('observation','hypothesis','field_test','validated','doctrine','foundational'))
- confidence REAL DEFAULT 0
- status TEXT CHECK(status IN ('active','retired','candidate','superseded'))
- evidence_count INTEGER DEFAULT 0
- created_after_mission_id TEXT REFERENCES missions(id)
- retired_at TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

### doctrine_applications
Links doctrine to missions and decisions.

Columns:
- id TEXT PRIMARY KEY
- doctrine_id TEXT REFERENCES doctrine_rules(id)
- mission_id TEXT REFERENCES missions(id)
- decision_id TEXT
- application_status TEXT CHECK(application_status IN ('applied','ignored','not_applicable','overridden'))
- notes TEXT
- created_at TEXT NOT NULL

### decisions
Records significant operator decisions.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- decision_type TEXT NOT NULL
- description TEXT NOT NULL
- decision_quality REAL
- decision_weight TEXT CHECK(decision_weight IN ('low','medium','high','critical'))
- outcome_label TEXT
- evidence_json TEXT
- occurred_at TEXT NOT NULL
- created_at TEXT NOT NULL

### debriefs
Stores operator self-report and system assessment.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT UNIQUE REFERENCES missions(id)
- operator_notes TEXT
- commander_assessment TEXT
- guardian_assessment TEXT
- historian_assessment TEXT
- internal_affairs_status TEXT
- honesty_confidence REAL
- completed_at TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

### archive_artifacts
Permanent records created after mission closure.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- artifact_type TEXT CHECK(artifact_type IN ('mission_report','behavior_report','decision_report','intelligence_report','doctrine_report','black_box','campaign_book','legacy_record'))
- title TEXT NOT NULL
- content_md TEXT NOT NULL
- importance INTEGER DEFAULT 1
- created_at TEXT NOT NULL

### recognition_records
Records invisible victories and honors.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- recognition_type TEXT NOT NULL
- title TEXT NOT NULL
- description TEXT NOT NULL
- awarded_for TEXT NOT NULL
- created_at TEXT NOT NULL

### ai_recommendations
Auditable recommendation ledger.

Columns:
- id TEXT PRIMARY KEY
- mission_id TEXT REFERENCES missions(id)
- department TEXT NOT NULL
- recommendation TEXT NOT NULL
- confidence REAL NOT NULL
- evidence_refs_json TEXT NOT NULL
- accepted INTEGER
- outcome_review TEXT
- created_at TEXT NOT NULL

### settings
Key-value configuration.

Columns:
- key TEXT PRIMARY KEY
- value_json TEXT NOT NULL
- updated_at TEXT NOT NULL

## Acceptance Criteria
- Database can create a mission, log events, capture behavior signals, create debrief, archive artifacts, and retrieve a complete Black Box timeline.
- No mission history is physically deleted by normal UI operations.
- Every AI recommendation stores evidence references.
- Every mission can be reconstructed chronologically from `mission_events`, `behavior_events`, `decisions`, and `identity_snapshots`.
