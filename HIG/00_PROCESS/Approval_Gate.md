# Approval Gate

## Purpose

The approval gate prevents implementation drift.

At the end of every engineering task, development pauses until the Operator approves the result.

## Required End-of-Task Format

Codex must respond with:

```text
Task Complete: <task name>

Implemented:
- ...

Changed Files:
- ...

Verification:
- Command: ...
- Result: ...

Known Limitations:
- ...

Recommended Next Task:
- ...

Awaiting approval before continuing.
```

## Approval States

- Approved — proceed to the next task.
- Needs Revision — fix the current task only.
- Re-scope — pause and redefine the task.
- Reject — revert or remove the implementation.

## Rule

No task may proceed automatically into another task.
