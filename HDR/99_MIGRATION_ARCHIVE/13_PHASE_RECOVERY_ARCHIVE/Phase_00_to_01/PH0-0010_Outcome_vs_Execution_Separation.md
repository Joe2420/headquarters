# PH0-0010 — Outcome vs Execution Separation

**Recovery Phase:** Phase 0.1–1.0  
**Category:** Operations  
**Priority:** CORE  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Every deployment receives separate outcome and execution ratings.

## Operator Experience
Operator is trained to value good losses and reject bad wins.

## Engineering Implementation
Store outcome_score and execution_score separately in Mission Reports and Decision Reports.

## Dependencies
Archives; Debrief; Commander

## Acceptance Criteria
- The feature can be identified in the Master Index.
- The feature has a clear implementation path.
- The feature supports disciplined execution rather than entertainment.
- The feature can be tested through mission-state or UX acceptance checks.

## Notes
Recovered during the phase-by-phase design recovery pass from Phase 0.1 through Phase 2.0.
