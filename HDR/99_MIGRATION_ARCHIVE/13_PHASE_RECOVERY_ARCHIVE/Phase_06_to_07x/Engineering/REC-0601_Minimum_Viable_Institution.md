# REC-0601 — Minimum Viable Institution

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Engineering  
**Priority:** P0  
**Owner:** Engineer  
**Status:** Recovered / Specification Draft  
**Target Volume:** 10_ENGINEERING

---

## Purpose
Defines the minimum set of systems that must exist before Headquarters can be considered real.

## Experience Objective
Prevents launching a beautiful but hollow application.

## Functional Specification
MVI requires Professional Joe, Mission Lifecycle, Guardian, Commander, Archives, Campaigns, Mirror Room, Ready Room, Observation, Debrief, Black Box, Doctrine, and Funded Mode.

## Engineering Implementation Notes
Use as the release gate for v1.0 application development; map each system to implementation tickets.

## Dependencies
- Headquarters Manifesto
- Roadmap
- Master Index

## Events / State Hooks
- release_candidate.created
- mvi_gate.checked

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can be transformed into milestone checklists in GitHub Projects.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `10_ENGINEERING/Minimum_Viable_Institution.md`.
