# REC-0614 — Rules of Engagement

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Operator / Command  
**Priority:** P0  
**Owner:** Commander  
**Status:** Recovered / Specification Draft  
**Target Volume:** 04_OPERATOR

---

## Purpose
Defines authority boundaries between Commander, Guardian, Sentinel, Historian, Internal Affairs, and Operator.

## Experience Objective
The Operator sees command as a responsibility that can drift and be restored, not as a vague mood.

## Functional Specification
Rules of Engagement must update from the Operator Model, Mission State, Guardian state, and Behavioral Engine. It should remain calm, concise, and non-shaming.

## Engineering Implementation Notes
Represent as state-machine objects and event-derived metrics. Do not let visual states rely on manual user input only.

## Dependencies
- Operator Model
- Behavior Engine
- Mission State
- Guardian
- HQOS Event Bus

## Events / State Hooks
- command.evaluated
- identity_drift.changed
- guardian.escalated
- mission.closed

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can feed long-term identity stability analytics and graduation tests.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `04_OPERATOR/Command/Rules_of_Engagement.md`.
