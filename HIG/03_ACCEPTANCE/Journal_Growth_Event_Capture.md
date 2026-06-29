# Journal Growth Event Capture

HIG-TASK-038 adds journal-derived growth event contracts inside the Journal subsystem.

## Boundary

- Growth events are represented as journal evidence, not Academy XP.
- Every growth event must reference a source journal entry, daily reflection, or trade review.
- Reward status is explicit and remains `not_awarded`.
- No automatic rewards, XP, doctrine promotion, AI interpretation, persistence, UI, or EventBus publishing are introduced.

## Acceptance

- Growth events can be represented deterministically.
- Growth events are traceable to journal evidence.
- Growth events remain distinct from Academy reward behavior.
