# Journal Search

HIG-TASK-040 adds deterministic search helpers for Journal entries.

## Boundary

- Search applies only to approved Journal entry fields: raw content, entry date, mood, market conditions, and source.
- Empty search criteria return defensive copies of all supplied entries.
- Search is deterministic and in-memory.
- No AI classification, persistence, indexing service, UI, EventBus publishing, or doctrine promotion is introduced.

## Acceptance

- Journal entries can be searched by approved fields.
- Empty result sets are represented safely.
- Source entries are not mutated by search.
