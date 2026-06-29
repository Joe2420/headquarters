# Sprint 5 - Journal System Backlog

Sprint Goal: Implement the journal system foundation for entries, reflections, trade reviews, growth events, timeline, search, and archive behavior.

---

## HIG-TASK-035 - Journal Entry

Scope:
- Add the first journal entry contract and workflow.
- Keep journal data local-first.
- Preserve journal architecture handoff intent.

Acceptance Criteria:
- Journal entries can be represented and saved through approved boundaries.
- No doctrine promotion occurs automatically.
- Validation passes.

---

## HIG-TASK-036 - Daily Reflection

Scope:
- Add daily reflection capture.
- Keep reflection fields behavior-focused.
- Avoid AI interpretation unless explicitly approved.

Acceptance Criteria:
- Daily reflections can be captured.
- Reflection data remains distinct from trade reviews.
- Validation passes.

---

## HIG-TASK-037 - Trade Review

Scope:
- Add trade review capture.
- Keep review fields behavior-first and evidence-oriented.
- Do not add market prediction behavior.

Acceptance Criteria:
- Trade reviews can be represented and saved.
- Trade review data remains separate from daily reflections.
- Validation passes.

---

## HIG-TASK-038 - Growth Events

Scope:
- Add journal-derived growth event capture.
- Keep growth events distinct from Academy XP implementation.
- Avoid automatic rewards unless explicitly approved.

Acceptance Criteria:
- Growth events can be represented.
- Growth events are traceable to journal evidence.
- Validation passes.

---

## HIG-TASK-039 - Journal Timeline

Scope:
- Add a journal timeline view or read model.
- Preserve chronological ordering.
- Keep timeline behavior read-only.

Acceptance Criteria:
- Journal timeline entries are ordered.
- Empty timeline state is handled.
- Validation passes.

---

## HIG-TASK-040 - Journal Search

Scope:
- Add basic journal search.
- Keep search deterministic.
- Avoid AI classification unless explicitly approved.

Acceptance Criteria:
- Journal entries can be searched by approved fields.
- Search handles empty results.
- Validation passes.

---

## HIG-TASK-041 - Journal Archive

Scope:
- Add journal archive behavior.
- Keep raw journal evidence immutable.
- Preserve derived metadata boundaries.

Acceptance Criteria:
- Journal entries can be archived or viewed as archived according to approved contracts.
- Raw journal evidence is not mutated by classification.
- Validation passes.

---

## HIG-TASK-042 - Sprint 5 Review

Scope:
- Review Journal System implementation.
- Confirm entry, reflection, trade review, growth event, timeline, search, and archive behavior.

Acceptance Criteria:
- Sprint 5 scope is reviewed against HIG.
- Validation passes.
- Any blockers for Sprint 6 are documented.
