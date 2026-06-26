---
normalized_from: 13_PHASE_RECOVERY/Phase_02_to_03/PH2-0019_Situation_Clock.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.219233Z
canonical_path: 09_INTERFACE/Screens/PH2-0019_Situation_Clock.md
---

# PH2-0019 — Situation Clock

**Recovery Phase:** Phase 2.0–3.0  
**Category:** Interface  
**Priority:** IMPORTANT  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Display operational time relative to market open, mission day, and deployment status.

## Operator Experience
Operator sees NYSE OPEN T-minus/plus clocks and mission day state.

## Engineering Implementation
Implement clock component with market-session configs and no dopamine styling.

## Dependencies
Operations Calendar

## Acceptance Criteria
- The feature is registered with a permanent phase-recovery ID.
- The feature has a clear implementation path.
- The feature supports disciplined execution, institutional memory, operator protection, or professional identity.
- The feature can be tested through state, UI, archive, AI, or UX acceptance checks.

## Notes
Recovered from Phase 2.0–3.0 architecture pass.
