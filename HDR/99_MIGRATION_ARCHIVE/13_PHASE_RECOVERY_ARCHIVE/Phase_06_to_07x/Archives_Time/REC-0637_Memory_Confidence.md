# REC-0637 — Memory Confidence

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Archives / Time  
**Priority:** P0  
**Owner:** Historian  
**Status:** Recovered / Specification Draft  
**Target Volume:** 08_ARCHIVES

---

## Purpose
Assigns reliability/confidence to historical matches and lessons.

## Experience Objective
The Operator sees today as one layer of a long professional career.

## Functional Specification
Memory Confidence must be represented with archive records, summaries, and retrieval paths, not only UI copy.

## Engineering Implementation Notes
Implement with SQLite tables for artifacts, summaries, confidence, campaign periods, and relationships. Generate higher-level summaries from lower-level records.

## Dependencies
- Archives
- SQLite Schema
- Historian
- Mission Engine
- Campaign Engine

## Events / State Hooks
- mission.archived
- campaign.closed
- year.closed
- historical_match.requested

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can support vector search, graph visualization, and long-term career comparisons.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `08_ARCHIVES/Memory_Core/Memory_Confidence.md`.
