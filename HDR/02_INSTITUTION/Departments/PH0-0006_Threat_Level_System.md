---
normalized_from: 13_PHASE_RECOVERY/Phase_00_to_01/PH0-0006_Threat_Level_System.md
normalized_version: HDR v1.0 Design Freeze Candidate
normalized_at: 2026-06-26T11:21:55.191297Z
canonical_path: 02_INSTITUTION/Departments/PH0-0006_Threat_Level_System.md
---

# PH0-0006 — Threat Level System

**Recovery Phase:** Phase 0.1–1.0  
**Category:** Guardian  
**Priority:** CORE  
**Status:** SPECIFIED  
**Owner:** Headquarters Architecture

## Purpose
Classify behavioral and capital threat into Green, Yellow, Orange, Red, Black.

## Operator Experience
The entire environment shifts according to threat without panic or theatrical alarm.

## Engineering Implementation
Threat state computed from losses, daily limit proximity, violations, overconfidence, Guardian triggers.

## Dependencies
Guardian; Lighting Engine; Mission State

## Acceptance Criteria
- The feature can be identified in the Master Index.
- The feature has a clear implementation path.
- The feature supports disciplined execution rather than entertainment.
- The feature can be tested through mission-state or UX acceptance checks.

## Notes
Recovered during the phase-by-phase design recovery pass from Phase 0.1 through Phase 2.0.
