# SQLite Schema v1

    **Owner:** Database  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Initial tables:

```sql
operators(id, name, created_at, active_profile_id)
operator_profiles(id, operator_id, mode, created_at)
missions(id, operator_id, campaign_id, status, started_at, ended_at, objective, condition)
mission_events(id, mission_id, type, timestamp, payload_json)
behavior_events(id, mission_id, type, timestamp, score, payload_json)
identity_snapshots(id, mission_id, timestamp, professional_score, drift_score, active_identity)
campaigns(id, operator_id, name, status, started_at, ended_at, objective)
doctrines(id, code, title, status, confidence, created_at, retired_at, body)
guardian_interventions(id, mission_id, level, reason, accepted, timestamp, payload_json)
debriefs(id, mission_id, honesty_status, body, created_at)
archive_items(id, type, title, importance, source_id, created_at, payload_json)
rooms(id, code, title, category, status)
ai_reports(id, mission_id, department, confidence, message, created_at, payload_json)
```

Every behavioral or institutional event must be reconstructable from `mission_events` and `behavior_events`.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
