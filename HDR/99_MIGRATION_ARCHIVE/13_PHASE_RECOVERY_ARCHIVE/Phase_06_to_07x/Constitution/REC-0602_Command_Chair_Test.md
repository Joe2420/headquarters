# REC-0602 — Command Chair Test

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Constitution  
**Priority:** P0  
**Owner:** Founder  
**Status:** Recovered / Specification Draft  
**Target Volume:** 01_CONSTITUTION

---

## Purpose
Provides the final test for whether a feature belongs in Headquarters.

## Experience Objective
Keeps the institution centered around Professional Joe rather than novelty.

## Functional Specification
Every feature asks: would this help Professional Joe remain in command?

## Engineering Implementation Notes
Add to design review template, feature proposal template, and merge checklist.

## Dependencies
- Professional Joe
- Command Chair
- Rule of Elegance

## Events / State Hooks
- feature.proposed
- feature.reviewed

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can be automated as a required markdown field in PRs.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `01_CONSTITUTION/Command_Chair_Test.md`.
