# Journal Timeline Read Model

HIG-TASK-039 adds a read-only timeline view model for Journal subsystem evidence.

## Boundary

- Timeline entries are derived from journal entries, daily reflections, trade reviews, and growth events.
- Timeline construction is read-only and does not mutate source records.
- Ordering is deterministic: occurrence date, then entry type, then source id.
- No persistence, UI, replay behavior, EventBus publishing, AI classification, or doctrine promotion is introduced.

## Acceptance

- Empty timeline state is represented explicitly.
- Journal timeline entries are ordered chronologically.
- Mixed journal evidence can be represented without changing source subsystem ownership.
