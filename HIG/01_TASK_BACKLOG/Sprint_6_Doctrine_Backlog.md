# Sprint 6 - Doctrine Backlog

Sprint Goal: Implement doctrine storage, viewing, candidate extraction, manual promotion, history, diffing, and trading plan integration.

---

## HIG-TASK-043 - Doctrine Repository

Scope:
- Add doctrine repository contracts and persistence.
- Keep doctrine records distinct from raw journal evidence.
- Preserve local-first behavior.

Acceptance Criteria:
- Doctrine records can be stored and loaded.
- Repository behavior is deterministic.
- Validation passes.

---

## HIG-TASK-044 - Doctrine Viewer

Scope:
- Add a read-only doctrine viewer.
- Display doctrine title, summary, confidence, and source.
- Avoid edit behavior unless explicitly included.

Acceptance Criteria:
- Doctrine records are visible.
- Empty doctrine state is handled.
- Validation passes.

---

## HIG-TASK-045 - Candidate Extraction

Scope:
- Add deterministic doctrine candidate extraction.
- Use approved journal evidence only.
- Do not auto-promote candidates into doctrine.

Acceptance Criteria:
- Candidate extraction is traceable.
- Candidates remain separate from accepted doctrine.
- Validation passes.

---

## HIG-TASK-046 - Manual Promotion

Scope:
- Add manual doctrine candidate promotion.
- Require explicit operator action.
- Preserve candidate source references.

Acceptance Criteria:
- Candidate promotion is explicit.
- Promoted doctrine preserves source context.
- Validation passes.

---

## HIG-TASK-047 - Doctrine History

Scope:
- Add doctrine history tracking.
- Preserve change chronology.
- Keep history read-only.

Acceptance Criteria:
- Doctrine changes can be reviewed.
- History order is deterministic.
- Validation passes.

---

## HIG-TASK-048 - Doctrine Diff

Scope:
- Add doctrine diff behavior.
- Compare doctrine versions deterministically.
- Keep diff output readable.

Acceptance Criteria:
- Doctrine differences can be represented.
- No mutation occurs during diffing.
- Validation passes.

---

## HIG-TASK-049 - Trading Plan Integration

Scope:
- Connect accepted doctrine to trading plan context.
- Keep integration read-oriented unless explicitly approved.
- Do not issue trade signals.

Acceptance Criteria:
- Trading plan can reference accepted doctrine.
- No market prediction behavior is introduced.
- Validation passes.

---

## HIG-TASK-050 - Sprint 6 Review

Scope:
- Review Doctrine implementation.
- Confirm repository, viewer, extraction, promotion, history, diff, and trading plan integration behavior.

Acceptance Criteria:
- Sprint 6 scope is reviewed against HIG.
- Validation passes.
- Any blockers for Sprint 7 are documented.
