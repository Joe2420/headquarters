# PH0-0008 — Account Killer Score

**Recovery Phase:** Phase 0.1–1.0  
**Category:** Guardian  
**Priority:** CORE  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Detect patterns historically associated with funded account destruction.

## Operator Experience
If dangerous behavior activates, Headquarters says Account Killer Active and recommends ending operations.

## Engineering Implementation
Aggregate weekend trading, success overtrading, daily limit neglect, early entries, re-entry chasing, risk increases.

## Dependencies
Guardian; Black Box; Historian

## Acceptance Criteria
- The feature can be identified in the Master Index.
- The feature has a clear implementation path.
- The feature supports disciplined execution rather than entertainment.
- The feature can be tested through mission-state or UX acceptance checks.

## Notes
Recovered during the phase-by-phase design recovery pass from Phase 0.1 through Phase 2.0.
