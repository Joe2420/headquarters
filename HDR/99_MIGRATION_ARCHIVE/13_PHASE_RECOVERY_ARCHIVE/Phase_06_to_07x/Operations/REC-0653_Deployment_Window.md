# REC-0653 — Deployment Window

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Operations  
**Priority:** P0  
**Owner:** Commander  
**Status:** Recovered / Specification Draft  
**Target Volume:** 05_OPERATIONS

---

## Purpose
Represents when doctrine permits capital deployment.

## Experience Objective
The Operator experiences Headquarters as an organized professional environment with rhythm, weight, and earned trust.

## Functional Specification
Deployment Window receives a dedicated specification with triggers, UI behavior, and institutional language.

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
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `05_OPERATIONS/Cycle_and_Trust/Deployment_Window.md`.
