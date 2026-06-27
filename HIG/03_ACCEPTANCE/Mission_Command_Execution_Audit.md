# Mission Command Execution Audit

## Scope

HQ-TASK-0027 documents the current mission command execution pipeline before persistence, archive writes, or EventBus publication are introduced.

## Pipeline

1. Mission command DTOs define typed command input.
2. Mission command validation checks unknown input and returns deterministic validation results.
3. The mission command dispatcher rejects invalid commands before handler execution.
4. Validated commands are routed to the mission command execution handler.
5. The execution handler returns deterministic in-memory command results.
6. Execution results can be mapped to mission command result event payload candidates.

## Current Guarantees

Execution remains in-memory and non-persistent.

Mission command result event candidates are not published yet.

No archive writes occur during command execution.

No database or schema behavior is introduced by the current execution pipeline.

No UI behavior is introduced by the current execution pipeline.

## Boundary Notes

The mission command execution handler may use `MissionKernel` to determine valid mission state transitions.

Existing mission commands require an injected mission loader. The handler does not save updated missions.

Result event mapping produces payload candidates only. Event envelope creation and EventBus publication require separate approved HQ tasks.
