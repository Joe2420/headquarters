---
normalized_from: 13_PHASE_RECOVERY/Phase_06_to_07x/Archives_Time/REC-0646_Institutional_Maturity.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.382264Z
canonical_path: 02_INSTITUTION/Departments/REC-0646_Institutional_Maturity.md
---

# REC-0646 — Institutional Maturity

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Archives / Time  
**Priority:** P1  
**Owner:** Historian  
**Status:** Recovered / Specification Draft  
**Target Volume:** 04_OPERATOR

---

## Purpose
Tracks Headquarters maturity, not just Operator maturity.

## Experience Objective
The Operator sees today as one layer of a long professional career.

## Functional Specification
Institutional Maturity must be represented with archive records, summaries, and retrieval paths, not only UI copy.

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
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `08_ARCHIVES/Memory_Core/Institutional_Maturity.md`.
