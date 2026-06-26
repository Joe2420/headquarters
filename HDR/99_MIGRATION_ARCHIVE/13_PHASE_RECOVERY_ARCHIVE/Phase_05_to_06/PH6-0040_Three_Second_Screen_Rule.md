# PH6-0040 — Three Second Screen Rule

**Phase Recovery:** Phase 5.0 → Phase 6.0  
**Category:** Interface  
**Priority:** IMPORTANT  
**Status:** SPECIFIED  
**Stability:** Stable

## Purpose

A screen fails if its purpose cannot be understood within three seconds.

## Design Origin

Recovered during the corrected Phase 5.0 → Phase 6.0 reconstruction pass. This recovery slice replaces the previous incomplete scaffold and expands the concepts into implementation-ready specifications.

## Operator Experience

Keeps rooms legible under stress.

The feature must support the central Headquarters objective: keeping Professional Joe in command, preserving institutional memory, and separating behavior quality from financial outcome.

## Engineering Implementation

UX acceptance criterion.

Implementation requirements:

- Register the object in the generated Master Index.
- Store state-changing events through HQOS rather than direct UI coupling.
- Persist evidence-relevant activity to the Archives.
- Expose only the minimum necessary UI to the Operator.
- Attach confidence values where the system makes an inference.
- Provide accessibility-safe alternatives for any sound, animation, or environmental signal.

## Dependencies

- HQOS Event Bus
- Mission Lifecycle
- Operator Model
- Archives
- Doctrine Library
- Council Protocol
- Evidence Confidence System

## Acceptance Criteria

- The system has one clear behavioral purpose.
- It does not predict market direction.
- It strengthens discipline, stewardship, judgment, identity stability, or institutional memory.
- It can be audited through stored evidence.
- It can be disabled or reduced without breaking the core mission lifecycle.

## Related Phase Objects

- Phase 5.0 Doctrine Engine systems
- Phase 5.1 Complacency Division systems
- Phase 5.2 Academy systems
- Phase 6.0 Manifesto and Chain of Command systems
- Phase 6.x Memory, Time, and Operations Cycle systems

## Revision History

- v0.7-corrected: Expanded corrected recovery specification from previous HDR v0.6 baseline.
