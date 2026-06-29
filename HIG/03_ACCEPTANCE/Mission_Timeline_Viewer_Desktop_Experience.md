# Mission Timeline Viewer Desktop Experience

## Scope

HQ-TASK-0069 implements HIG-TASK-032 by adding a read-only mission timeline viewer to the desktop Command Center.

## Boundary

- The viewer displays DTO-shaped timeline entries compatible with existing HQOS timeline export contracts.
- It does not implement replay.
- It does not add projections or persistence.
- Timeline entries are derived from existing desktop mission context and sorted chronologically.

## Acceptance Notes

- Empty timelines are represented safely.
- Single-entry timelines are represented safely.
- Multi-entry timelines preserve chronological ordering.
- The timeline viewer displays lifecycle transitions and timestamps.
