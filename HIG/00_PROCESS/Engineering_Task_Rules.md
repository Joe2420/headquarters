# Engineering Task Rules

## Rule 1 — No Large Builds

Codex must never attempt to build Headquarters as one complete application in a single run.

Every implementation request must be scoped as a 2-4 hour engineering task.

## Rule 2 — One Primary Objective Per Task

Each task must have one primary objective.

Examples:
- Create the HQOS event envelope.
- Implement the Mission state machine.
- Build the Command Chair shell component.
- Add the first SQLite migration runner.

A task that mixes unrelated goals must be split before implementation.

## Rule 3 — Approval Gate Required

After completing a task, Codex must stop.

Codex must not continue to the next task until the Operator approves.

## Rule 4 — No Architectural Invention

Codex may not invent new architecture if HDR, HTB, or HIG already define the area.

If the specification is unclear, Codex must ask for clarification or propose a small decision record.

## Rule 5 — Preserve Headquarters Identity

Implementation must preserve the following principles:

- Behavior before outcome.
- Silence is a feature.
- The Operator remains responsible.
- AI advises but does not replace judgment.
- The institution stays calm.
- No market prediction.
- No social mechanics.
- No dopamine manipulation.

## Rule 6 — Working Software Over Decorative UI

Early tasks prioritize correctness, state, events, database, and testability.

Immersive visuals, lighting, animation, and sound are implemented after the system foundation is stable.

## Rule 7 — End Every Task With a Report

Each task completion report must include:

- Objective completed.
- Files changed.
- Commands run.
- Tests/checks passed.
- Known limitations.
- Suggested next task.
- Explicit request for approval.
