# Task Workflow

## Standard Task Lifecycle

1. Task drafted.
2. Scope verified.
3. Dependencies checked.
4. Codex implementation begins.
5. Code written.
6. Tests run.
7. Documentation updated.
8. Task report produced.
9. Approval requested.
10. Next task begins only after approval.

## Engineering Task Size

Each task must be sized for 2–4 hours.

If a task is larger, it must be split.

Examples:

- Bad: Build the mission system.
- Good: Implement MissionState enum, reducer, and tests.
- Good: Implement MissionService.startMission with event emission.
- Good: Implement MissionEvent persistence table and repository methods.

## Task ID Format

`HQ-TASK-0001`

Task IDs are sequential and never reused.

## Task Metadata

Each task must contain:

- Task ID
- Title
- Estimated time
- Source references
- Dependencies
- Files likely affected
- Deliverables
- Acceptance criteria
- Tests
- Documentation updates
- Rollback plan
- Approval gate

## Approval Gate

After task completion, Codex must stop.

No implicit continuation is allowed.

## Preflight

Before writing code, Codex must report:
- Expected files changed
- Expected packages changed
- Architecture risk
- Test plan
- Rollback plan
