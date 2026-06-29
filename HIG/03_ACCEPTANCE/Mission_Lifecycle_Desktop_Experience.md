# Mission Lifecycle Desktop Experience

## Scope

HQ-TASK-0066 implements HIG-TASK-029 by exposing the mission lifecycle path in the desktop Command Center.

## Boundary

- Lifecycle transition rules remain owned by HQOS.
- The desktop surface is read-only and does not encode allowed transition logic.
- The lifecycle panel derives display state from typed mission state values.

## Acceptance Notes

- The lifecycle path is visible in the Mission Operations panel.
- Empty mission state is represented as pending lifecycle steps.
- Active mission state is marked as the current lifecycle step.
- Completed and pending lifecycle steps are deterministic.
