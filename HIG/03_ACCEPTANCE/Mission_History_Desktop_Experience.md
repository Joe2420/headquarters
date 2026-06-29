# Mission History Desktop Experience

## Scope

HQ-TASK-0070 implements HIG-TASK-033 by adding a read-only mission history surface to the desktop Command Center.

## Boundary

- Mission history displays desktop mission snapshots only.
- It does not mutate mission records.
- It does not add new persistence behavior.
- Existing mission state helpers remain the source for local display state changes.

## Acceptance Notes

- Empty mission history is represented safely.
- Created missions are appended to history.
- Existing mission snapshots are updated in place by mission id.
- Mission history remains deterministic and read-only in the UI.
