# PH0-0012 — Mission History Not Trade History

**Recovery Phase:** Phase 0.1–1.0  
**Category:** Archives  
**Priority:** CORE  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Archive full missions rather than isolated trades.

## Operator Experience
Mission records show status, integrity, execution, trades, rule violations, lessons, not just PnL.

## Engineering Implementation
Mission entity must be primary database unit; trades are child objects.

## Dependencies
SQLite Schema; Archives

## Acceptance Criteria
- The feature can be identified in the Master Index.
- The feature has a clear implementation path.
- The feature supports disciplined execution rather than entertainment.
- The feature can be tested through mission-state or UX acceptance checks.

## Notes
Recovered during the phase-by-phase design recovery pass from Phase 0.1 through Phase 2.0.
