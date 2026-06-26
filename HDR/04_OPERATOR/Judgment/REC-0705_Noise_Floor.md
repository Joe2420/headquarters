---
normalized_from: 13_PHASE_RECOVERY/Phase_06_to_07x/Stewardship_Judgment/REC-0705_Noise_Floor.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.426135Z
canonical_path: 04_OPERATOR/Judgment/REC-0705_Noise_Floor.md
---

# REC-0705 — Noise Floor

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Stewardship / Judgment  
**Priority:** P1  
**Owner:** Medical Officer  
**Status:** Recovered / Specification Draft  
**Target Volume:** 04_OPERATOR

---

## Purpose
Personal behavioral threshold beyond which decision quality declines.

## Experience Objective
The Operator feels entrusted, grounded, and accountable rather than excited or overconfident.

## Functional Specification
Noise Floor must be tied to measurable events and explicit Funded Mode/Operator Model fields.

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
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `04_OPERATOR/Judgment_and_Stewardship/Noise_Floor.md`.
