# Task Workflow

## Standard Task Lifecycle

1. Task drafted.
2. Scope verified.
3. Dependencies checked.
4. Git preflight completed.
5. Codex implementation begins.
6. Code or documentation updated.
7. Tests and verification run.
8. Documentation updated when required.
9. Task commit created when requested or required.
10. Task report produced.
11. Approval requested.
12. Next task begins only after approval.

## Engineering Task Size

Each task must be sized for 2-4 hours.

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

## Git Preflight

Before implementation, Codex must follow `HDC/11_Git_Workflow.md` and confirm:

- Current branch
- Target task branch
- Working tree status
- Whether remote exists
- Whether the task branch already exists

If the working tree is not clean, Codex must stop and ask for approval before continuing.

## Commit Step

When a task requires a commit, Codex must:

- Stage only task-relevant files.
- Use the requested commit message, or Conventional Commit style when no message is specified.
- Report the commit hash in the task completion report.
- Stop after the commit and wait for approval.
