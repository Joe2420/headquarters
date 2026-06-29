# Sprint 4 - Mission Operations Backlog

Sprint Goal: Strengthen mission operations around creation, authorization, lifecycle viewing, details, archive viewing, timeline viewing, and mission history.

---

## HIG-TASK-027 - Mission Creation

Scope:
- Implement the next mission creation experience required by the desktop roadmap.
- Reuse existing mission creation services and repositories.
- Keep UI behavior aligned with HQOS ownership.

Acceptance Criteria:
- Mission creation is usable from the desktop experience.
- Existing mission creation contracts remain stable.
- Validation passes.

---

## HIG-TASK-028 - Mission Authorization

Scope:
- Implement the next mission authorization experience.
- Use existing authorization request contracts.
- Do not introduce market prediction.

Acceptance Criteria:
- Authorization state is visible and deterministic.
- Approval or denial behavior follows existing rule-based contracts.
- Validation passes.

---

## HIG-TASK-029 - Mission Lifecycle

Scope:
- Expose the mission lifecycle path in the desktop experience.
- Keep lifecycle transitions owned by HQOS.
- Avoid duplicating state-machine rules in UI.

Acceptance Criteria:
- Mission lifecycle state is understandable.
- Invalid transitions remain rejected by HQOS.
- Validation passes.

---

## HIG-TASK-030 - Mission Details

Scope:
- Add a mission details surface.
- Display mission identity, objective, current state, and timestamps.
- Keep the details surface read-oriented unless explicitly approved.

Acceptance Criteria:
- Mission details are visible.
- Details are derived from typed mission data.
- Validation passes.

---

## HIG-TASK-031 - Mission Archive Viewer

Scope:
- Add a viewer for archived mission summaries.
- Use existing archive summary contracts where possible.
- Do not implement future amendment flows.

Acceptance Criteria:
- Archived mission summaries can be viewed.
- Archived missions remain read-only.
- Validation passes.

---

## HIG-TASK-032 - Timeline Viewer

Scope:
- Add a read-only timeline viewer for mission lifecycle events.
- Use existing mission timeline read-model contracts.
- Preserve chronological ordering.

Acceptance Criteria:
- Timeline entries are displayed in order.
- Empty and single-entry timelines are handled.
- Validation passes.

---

## HIG-TASK-033 - Mission History

Scope:
- Add mission history retrieval or display behavior.
- Use existing persistence/read contracts where possible.
- Keep the history surface read-only.

Acceptance Criteria:
- Mission history is visible and deterministic.
- History does not mutate mission records.
- Validation passes.

---

## HIG-TASK-034 - Sprint 4 Review

Scope:
- Review Mission Operations implementation.
- Confirm creation, authorization, lifecycle, details, archive viewer, timeline viewer, and history behavior.

Acceptance Criteria:
- Sprint 4 scope is reviewed against HIG.
- Validation passes.
- Any blockers for Sprint 5 are documented.
