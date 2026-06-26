---
normalized_from: 13_PHASE_RECOVERY/Phase_02_to_03/PH2-0020_Operator_Presence_Detection.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.219515Z
canonical_path: 04_OPERATOR/Behavioral_Systems/PH2-0020_Operator_Presence_Detection.md
---

# PH2-0020 — Operator Presence Detection

**Recovery Phase:** Phase 2.0–3.0  
**Category:** Behavior  
**Priority:** IMPORTANT  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Detect rapid interaction patterns such as chart switching, zooming, and frantic movement.

## Operator Experience
Operator receives subtle stability signal rather than accusation.

## Engineering Implementation
Implement event telemetry for focus changes, navigation rate, mouse velocity, and decision speed.

## Dependencies
Behavior Engine; Privacy Design

## Acceptance Criteria
- The feature is registered with a permanent phase-recovery ID.
- The feature has a clear implementation path.
- The feature supports disciplined execution, institutional memory, operator protection, or professional identity.
- The feature can be tested through state, UI, archive, AI, or UX acceptance checks.

## Notes
Recovered from Phase 2.0–3.0 architecture pass.
