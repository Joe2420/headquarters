# Journal Archive

HIG-TASK-041 adds Journal archive contracts for viewing entries as archived evidence.

## Boundary

- Archived records preserve a defensive copy of the raw journal entry.
- Classification status and tags live in archive metadata, separate from raw evidence.
- Archive helpers do not mutate source journal entries.
- No database schema, persistence implementation, UI, EventBus publishing, AI classification, or doctrine promotion is introduced.

## Acceptance

- Journal entries can be represented as archived records.
- Raw journal evidence is not mutated by archive metadata.
- Archive records can be copied and listed without exposing source references.
