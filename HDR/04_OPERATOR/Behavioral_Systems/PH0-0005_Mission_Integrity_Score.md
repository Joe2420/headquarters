---
normalized_from: 13_PHASE_RECOVERY/Phase_00_to_01/PH0-0005_Mission_Integrity_Score.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.191009Z
canonical_path: 04_OPERATOR/Behavioral_Systems/PH0-0005_Mission_Integrity_Score.md
---

# PH0-0005 — Mission Integrity Score

**Recovery Phase:** Phase 0.1–1.0  
**Category:** Behavior System  
**Priority:** CORE  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Measure whether the mission was performed according to process regardless of PnL.

## Operator Experience
A red PnL day can be marked successful if integrity is high; a green PnL day can be compromised.

## Engineering Implementation
Score from briefing completion, prep, authorization usage, rule compliance, trade limits, debrief completion.

## Dependencies
Mission Lifecycle; Debrief; Archives

## Acceptance Criteria
- The feature can be identified in the Master Index.
- The feature has a clear implementation path.
- The feature supports disciplined execution rather than entertainment.
- The feature can be tested through mission-state or UX acceptance checks.

## Notes
Recovered during the phase-by-phase design recovery pass from Phase 0.1 through Phase 2.0.
