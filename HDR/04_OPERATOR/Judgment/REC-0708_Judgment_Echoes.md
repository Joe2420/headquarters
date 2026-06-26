---
normalized_from: 13_PHASE_RECOVERY/Phase_06_to_07x/Stewardship_Judgment/REC-0708_Judgment_Echoes.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.427139Z
canonical_path: 04_OPERATOR/Judgment/REC-0708_Judgment_Echoes.md
---

# REC-0708 — Judgment Echoes

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Stewardship / Judgment  
**Priority:** P2  
**Owner:** Medical Officer  
**Status:** Recovered / Specification Draft  
**Target Volume:** 04_OPERATOR

---

## Purpose
Flags decisions likely to echo into future campaigns.

## Experience Objective
The Operator feels entrusted, grounded, and accountable rather than excited or overconfident.

## Functional Specification
Judgment Echoes must be tied to measurable events and explicit Funded Mode/Operator Model fields.

## Engineering Implementation Notes
Implement with event-derived metrics, mission records, and conditional Guardian/Medical interventions. Avoid moralizing; use operational language.

## Dependencies
- Funded Mode
- Guardian
- Operator Model
- Mission Events
- Archives

## Events / State Hooks
- funded.activated
- decision.recorded
- judgment.reserve_changed
- mission.closed

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can later integrate broker imports and wearable fatigue signals if available.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `04_OPERATOR/Judgment_and_Stewardship/Judgment_Echoes.md`.
