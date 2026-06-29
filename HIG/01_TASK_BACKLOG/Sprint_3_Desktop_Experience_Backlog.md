# Sprint 3 - Desktop Experience Backlog

Sprint Goal: First launchable Headquarters prototype.

Rules:
- Keep tasks small.
- No Guardian.
- No Academy.
- No full room system.
- No immersive animations yet.
- Focus only on the first launchable and testable desktop experience.

---

## HIG-TASK-019 - Sprint 3 Backlog

Scope:
- Create the Sprint 3 Desktop Experience backlog.
- Register the backlog in the HIG registry.
- Do not modify runtime application code.

Acceptance Criteria:
- Sprint 3 backlog exists.
- HIG registry points to the Sprint 3 backlog.
- Validation passes.

---

## HIG-TASK-020 - Desktop Runtime Verification

Scope:
- Verify desktop runtime launch behavior.
- Verify startup status renders without visible startup errors.
- Document or test the launch verification path.

Acceptance Criteria:
- Desktop app shell can be verified as launchable.
- Startup status remains deterministic.
- No product behavior is added.

---

## HIG-TASK-021 - Report for Duty Flow

Scope:
- Harden the existing Report for Duty flow.
- Ensure the transition into Command Center is deterministic.
- Preserve the current first-launch experience.

Acceptance Criteria:
- Report for Duty flow remains test-covered.
- Repeated activation is safe.
- No full room system is introduced.

---

## HIG-TASK-022 - Command Center Layout MVP

Scope:
- Improve the Command Center layout for first launchable use.
- Keep content focused on command status, mission board, and operational panels.
- Use existing UI conventions.

Acceptance Criteria:
- Command Center layout is clear and stable.
- Existing panels remain accessible.
- No full room navigation system is introduced.

---

## HIG-TASK-023 - HQOS Status Dashboard

Scope:
- Make the HQOS/database/migration status panel useful for first-launch diagnostics.
- Keep status read-only.
- Surface startup success and failure states clearly.

Acceptance Criteria:
- HQOS status is visible and deterministic.
- Database and migration status remain readable.
- No direct UI database access is introduced.

---

## HIG-TASK-024 - Mission Board Read Only

Scope:
- Harden the Mission Board as a read-only mission summary surface.
- Display current mission context and lifecycle state.
- Avoid mutation behavior in the board itself.

Acceptance Criteria:
- Mission Board displays mission context clearly.
- Mission Board remains read-only.
- No mission workflow logic moves into UI components.

---

## HIG-TASK-025 - Navigation Framework MVP

Scope:
- Add a minimal desktop navigation framework for launchable app orientation.
- Keep navigation non-immersive and lightweight.
- Do not implement the full room system.

Acceptance Criteria:
- Navigation framework is visible.
- Active area is understandable.
- No Guardian, Academy, or full room implementation is introduced.

---

## HIG-TASK-026 - Sprint 3 Review

Scope:
- Validate the first launchable desktop experience.
- Confirm app shell, Report for Duty, Command Center, HQOS status, Mission Board, and navigation framework are coherent.

Acceptance Criteria:
- Sprint 3 scope is reviewed against HIG.
- Validation passes.
- Any blockers for Sprint 4 are documented.
