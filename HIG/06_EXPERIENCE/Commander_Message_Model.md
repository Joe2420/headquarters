# Commander Message Model

## Purpose

Commander messages are deterministic operational guidance. They are not chat, generated prose, market prediction, or a network feature.

## Message Types

- briefing
- guidance
- warning
- acknowledgement
- transition
- debrief
- recognition
- interruption

## Required Fields

- id
- timestamp
- room
- tone
- priority
- text
- primaryAction
- secondaryActions
- source

## Rules

- No AI integration.
- No generated text.
- No chat API.
- No network calls.
- Messages must be authored by deterministic code paths or static fixtures.
- Message ordering is timestamp first, then id for stable tie-breaking.
- Commander speaks with calm institutional restraint and never predicts markets.
- A message should point to one primary action unless the correct action is to stand by.

## Rendering Readiness

The model is thread-ready: later tasks can render ordered messages as a Commander thread while preserving deterministic order and source traceability.

## Source Values

Initial renderer foundations may use `system`, `mission-state`, `room-transition`, `guardian`, or `operator-action`. These are provenance labels only; they do not imply backend behavior.

## Acceptance Boundary

This task defines the contract and lightweight renderer helper only. It does not connect to an AI service, add persistence, or change HQOS behavior.
