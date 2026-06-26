# Implementation Decision Log v0.4

## ID-0001 — Local-first desktop application
Decision: Headquarters starts as a local-first Electron desktop app.
Reason: Trading workflow requires low friction, private data ownership, offline resilience, and second-screen use.

## ID-0002 — Rule-based AI before LLM
Decision: Sprint 1 and Sprint 2 use deterministic rule-based AI stubs.
Reason: The institution must be reliable before it becomes conversational.

## ID-0003 — Event-sourced mission history
Decision: Important state transitions are persisted as events.
Reason: Black Box, Archives, and replay require chronological institutional memory.

## ID-0004 — SQLite first
Decision: SQLite is the first storage engine.
Reason: Local-first simplicity, portability, and sufficient power for early Headquarters.

## ID-0005 — No broker integration in early sprints
Decision: Broker/trading-platform integrations are deferred.
Reason: Headquarters measures decisions first, executions second.
