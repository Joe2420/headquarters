# REC-0627 — Legacy Transfer

**Recovery Slice:** Phase 6.0 → Phase 7.x  
**Category:** Legacy  
**Priority:** P1  
**Owner:** Historian  
**Status:** Recovered / Specification Draft  
**Target Volume:** 12_LEGACY

---

## Purpose
Allows mature Operator to leave lessons for future operators or future self.

## Experience Objective
Headquarters feels like a living institution instead of a tool that only exists during active trading.

## Functional Specification
Legacy Transfer should be documented as a stateful institutional system with explicit triggers and UX boundaries.

## Engineering Implementation Notes
Use scheduled events, background services, and archive writes. Avoid fake busywork; all activity must support preparation, protection, teaching, or memory.

## Dependencies
- HQOS Heartbeat
- Archives
- Night Operations
- Rhythm Engine

## Events / State Hooks
- session.closed
- night_ops.started
- weekly_cycle.tick
- market.closed

## Acceptance Criteria
- Specification contains purpose, UX intent, engineering notes, dependencies, and acceptance criteria.
- Object is registered in the phase recovery index.
- Object has a clear migration target for repository normalization.

## Future Expansion
Can later integrate with calendar reminders, local notifications, and Git-style release notes.

## Migration Target
During normalization this file should move from `13_PHASE_RECOVERY/Phase_06_to_07x/` into `05_OPERATIONS/Institutional_Rhythm/Legacy_Transfer.md`.
