# Mission Command Pipeline Boundary Governance

## Scope

HQ-TASK-0031 documents the current mission command pipeline boundaries before persistence or EventBus integration.

## Component Boundaries

Command DTOs only describe command intent.

Command validation only accepts or rejects command shape and invariants.

`MissionCommandDispatcher` only validates incoming commands and routes valid commands to the injected handler.

`MissionCommandExecutionHandler` performs deterministic in-memory mission command execution.

`MissionCommandExecutionOrchestrator` composes existing pieces and returns the execution result plus the event payload candidate.

Execution result-event mapping only creates event payload candidates.

## Current Prohibitions

No EventBus publishing exists in this pipeline yet.

No archive writes or persistence exist in this pipeline yet.

`MissionCommandDispatcher` must never execute commands or publish events.

`MissionCommandExecutionHandler` must not publish events or write archives.

`MissionCommandExecutionOrchestrator` must remain thin composition.

Persistence, archive writes, EventBus publishing, and event envelope creation require separate approved HQ tasks.
