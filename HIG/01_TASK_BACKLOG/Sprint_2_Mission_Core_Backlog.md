# Sprint 2 — Mission Core Backlog

Sprint Objective: Implement the first usable mission lifecycle without full AI or visual immersion.

---

## HIG-TASK-011 — Mission Creation Service

Scope:
- Create MissionService.createMission().
- Persist mission record.
- Emit MissionCreated event.

Acceptance Criteria:
- Mission ID generated.
- Mission persisted.
- Event emitted.

---

## HIG-TASK-012 — Briefing State

Scope:
- Add briefing start and completion transitions.
- Store briefing status.

Acceptance Criteria:
- Mission can enter briefing.
- Mission can mark briefing complete.
- Invalid transitions rejected.

---

## HIG-TASK-013 — Observation State

Scope:
- Add Observation Room session tracking.
- Track observation start, duration, and completion.

Acceptance Criteria:
- Observation session saved.
- Observation duration calculated.
- Events emitted.

---

## HIG-TASK-014 — Authorization Request MVP

Scope:
- Implement manual authorization request.
- Return rule-based placeholder approval/denial.

Acceptance Criteria:
- Request creates AuthorizationRequested event.
- Response creates AuthorizationApproved or AuthorizationDenied event.
- No market prediction.

---

## HIG-TASK-015 — Return To Base MVP

Scope:
- Implement ReturnToBase action.
- Close active mission workflow safely.

Acceptance Criteria:
- Mission transitions to return_to_base.
- Event persisted.
- UI shows mission closing state.

---

## HIG-TASK-016 — Debrief MVP

Scope:
- Create debrief form with behavior-first fields.
- Save debrief.

Acceptance Criteria:
- Debrief persists.
- Mission can transition to archived only after debrief.

---

## HIG-TASK-017 — Mission Archive MVP

Scope:
- Archive mission and events.
- Display archived mission summary.

Acceptance Criteria:
- Archived mission cannot be edited without explicit future amendment flow.
- Summary can be retrieved.

---

## HIG-TASK-018 — Sprint 2 Review Package

Scope:
- Validate mission lifecycle end-to-end.
- Confirm event trace can reconstruct mission timeline.
