# Sprint 1 — Foundation Backlog

Sprint Objective: Establish the monorepo, local app shell, event foundation, and database foundation without building full feature complexity.

Each task is designed for 2-4 hours.

---

## HIG-TASK-001 — Verify Monorepo Scaffold

Scope:
- Validate package manager setup.
- Confirm workspace packages load.
- Ensure TypeScript project references compile.

Acceptance Criteria:
- `pnpm install` succeeds.
- `pnpm typecheck` succeeds or reports only documented TODOs.
- Workspace package imports resolve.

Do not implement UI features in this task.

---

## HIG-TASK-002 — Implement Shared Domain Types

Scope:
- Create core shared TypeScript types for Mission, Campaign, OperatorState, Department, HQEvent, and Doctrine.
- Keep types minimal but stable.

Acceptance Criteria:
- Types exported from `packages/shared`.
- All packages can import the shared types.
- No runtime logic added.

---

## HIG-TASK-003 — Implement HQOS Event Envelope

Scope:
- Implement the canonical event envelope.
- Include event ID, type, timestamp, source, payload, correlation ID, and metadata.

Acceptance Criteria:
- Event envelope type exists.
- Event factory creates valid events.
- Unit tests cover event creation.

---

## HIG-TASK-004 — Implement Event Bus MVP

Scope:
- Create in-memory publish/subscribe event bus.
- Support subscribe, unsubscribe, publish, and event history buffer.

Acceptance Criteria:
- Events can be published and received.
- Subscribers can unsubscribe.
- Event order is preserved.
- Unit tests pass.

---

## HIG-TASK-005 — Implement Mission State Machine MVP

Scope:
- Implement mission states: idle, briefing, ready, observation, authorization, deployed, return_to_base, debrief, archived.
- Events trigger transitions.

Acceptance Criteria:
- Invalid transitions are rejected.
- Valid transitions emit events.
- Unit tests cover normal mission flow.

---

## HIG-TASK-006 — Implement SQLite Connection Layer

Scope:
- Add local SQLite connection module.
- Add migration runner.
- Apply initial migration.

Acceptance Criteria:
- Database file is created locally.
- Migration table exists.
- Initial schema applies once.

---

## HIG-TASK-007 — Implement Archive Repository MVP

Scope:
- Create repository methods for saving and retrieving mission events.

Acceptance Criteria:
- Events persist to SQLite.
- Events can be read back by mission ID.
- Repository tests pass.

---

## HIG-TASK-008 — Desktop Shell: Report for Duty

Scope:
- Build initial Electron/React shell.
- Display Headquarters startup surface with `REPORT FOR DUTY` action.
- Clicking action transitions to command shell placeholder.

Acceptance Criteria:
- App starts locally.
- Button triggers state transition.
- No immersive animation required yet.

---

## HIG-TASK-009 — Command Chair Placeholder

Scope:
- Create Command Chair component.
- Display current operator command status.
- Wire to local state only.

Acceptance Criteria:
- Component renders.
- Command state can be toggled for development.
- No AI logic required.

---

## HIG-TASK-010 — Sprint 1 Review Package

Scope:
- Produce a review report summarizing implemented foundation.
- Identify blockers before Sprint 2.

Acceptance Criteria:
- Report lists completed tasks, test status, unresolved issues, and next-sprint readiness.
