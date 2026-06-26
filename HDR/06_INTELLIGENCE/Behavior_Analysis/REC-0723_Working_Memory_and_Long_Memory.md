---
normalized_from: 13_PHASE_RECOVERY/Phase_06_to_07x/Intelligence/REC-0723_Working_Memory_and_Long_Memory.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.402616Z
canonical_path: 06_INTELLIGENCE/Behavior_Analysis/REC-0723_Working_Memory_and_Long_Memory.md
---

# REC-0723 — Working Memory and Long Memory

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Intelligence  
**Priority:** P0  
**Owner:** Intelligence Officer  
**Status:** Recovered / Specification Draft  
**Target Volume:** 06_INTELLIGENCE

---

## Purpose
Separates session working memory from long-term Archives.

## Experience Objective
Headquarters becomes coherent, quiet, and institutionally mature instead of a collection of features.

## Functional Specification
Working Memory and Long Memory must be represented as a first-class architectural object and linked to registry, tests, and implementation milestones.

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
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `06_INTELLIGENCE/Working_Memory_and_Long_Memory.md`.
