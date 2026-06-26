---
normalized_from: 13_PHASE_RECOVERY/Phase_06_to_07x/Operations/REC-0652_Operational_State_Classification.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.412687Z
canonical_path: 10_ENGINEERING/Architecture/REC-0652_Operational_State_Classification.md
---

# REC-0652 — Operational State Classification

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Operations  
**Priority:** P0  
**Owner:** Commander  
**Status:** Recovered / Specification Draft  
**Target Volume:** 05_OPERATIONS

---

## Purpose
Classifies days as Mission Ready, Limited Capability, Training Only, Recovery Day, or Suspended.

## Experience Objective
The Operator experiences Headquarters as an organized professional environment with rhythm, weight, and earned trust.

## Functional Specification
Operational State Classification receives a dedicated specification with triggers, UI behavior, and institutional language.

## Engineering Implementation Notes
Implement through mission state, scheduled events, environmental state manager, and archive-backed logs where applicable.

## Dependencies
- HQOS
- Mission State
- Operator Model
- Archives

## Events / State Hooks
- daily.started
- room.entered
- mission.state_changed
- recommendation.issued

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can later support user-configurable but doctrine-bound variations.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `05_OPERATIONS/Cycle_and_Trust/Operational_State_Classification.md`.
