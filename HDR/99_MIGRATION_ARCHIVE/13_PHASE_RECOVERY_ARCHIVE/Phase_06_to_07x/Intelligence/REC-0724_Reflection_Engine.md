# REC-0724 — Reflection Engine

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Intelligence  
**Priority:** P1  
**Owner:** Intelligence Officer  
**Status:** Recovered / Specification Draft  
**Target Volume:** 06_INTELLIGENCE

---

## Purpose
Nightly institutional reflection after missions close.

## Experience Objective
Headquarters becomes coherent, quiet, and institutionally mature instead of a collection of features.

## Functional Specification
Reflection Engine must be represented as a first-class architectural object and linked to registry, tests, and implementation milestones.

## Engineering Implementation Notes
Implement with metadata-driven docs, event-sourced architecture, state machines, and repository normalization tooling.

## Dependencies
- HQOS
- Master Index
- Archives
- Council
- Repository Standards

## Events / State Hooks
- event.published
- doc.generated
- audit.started
- release.reviewed

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can later power automated documentation checks, dependency graphs, and Codex implementation prompts.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `06_INTELLIGENCE/Reflection_Engine.md`.
