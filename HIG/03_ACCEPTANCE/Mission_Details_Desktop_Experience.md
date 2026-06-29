# Mission Details Desktop Experience

## Scope

HQ-TASK-0067 implements HIG-TASK-030 by adding a read-oriented mission details surface to the desktop Command Center.

## Boundary

- The details surface does not mutate mission records.
- Details are derived from the typed active mission data already available to the desktop experience.
- No additional persistence, workflow, or archive behavior is introduced.

## Acceptance Notes

- Mission identity is visible.
- Mission objective is visible.
- Current mission state is visible.
- Created timestamp is visible.
- Empty mission context is represented safely.
