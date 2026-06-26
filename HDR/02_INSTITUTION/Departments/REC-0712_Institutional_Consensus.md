---
normalized_from: 13_PHASE_RECOVERY/Phase_06_to_07x/Intelligence/REC-0712_Institutional_Consensus.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.401227Z
canonical_path: 02_INSTITUTION/Departments/REC-0712_Institutional_Consensus.md
---

# REC-0712 — Institutional Consensus

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Intelligence  
**Priority:** P0  
**Owner:** Intelligence Officer  
**Status:** Recovered / Specification Draft  
**Target Volume:** 06_INTELLIGENCE

---

## Purpose
Commander recommendations derive from department consensus rather than isolated AI opinion.

## Experience Objective
Headquarters becomes coherent, quiet, and institutionally mature instead of a collection of features.

## Functional Specification
Institutional Consensus must be represented as a first-class architectural object and linked to registry, tests, and implementation milestones.

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
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `06_INTELLIGENCE/Institutional_Consensus.md`.
