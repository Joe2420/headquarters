# PH2-0063 — Doctrine Not Editable During Combat

**Recovery Phase:** Phase 2.0–3.0  
**Category:** Doctrine  
**Priority:** CORE  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Prevent emotional rule rewriting during active missions.

## Operator Experience
Operator cannot edit Constitution or active doctrine while deployed.

## Engineering Implementation
Implement state lock for doctrine edits during mission active/threat states.

## Dependencies
Doctrine Engine; Mission State

## Acceptance Criteria
- The feature is registered with a permanent phase-recovery ID.
- The feature has a clear implementation path.
- The feature supports disciplined execution, institutional memory, operator protection, or professional identity.
- The feature can be tested through state, UI, archive, AI, or UX acceptance checks.

## Notes
Recovered from Phase 2.0–3.0 architecture pass.
