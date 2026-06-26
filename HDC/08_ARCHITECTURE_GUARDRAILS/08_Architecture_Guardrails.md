# Architecture Guardrails

## Guardrail 1 — HQOS Is Mandatory

No core product behavior may bypass HQOS.

## Guardrail 2 — UI Does Not Own Business Logic

React components render and dispatch. They do not contain mission logic, doctrine logic, AI logic, database logic, or state-machine rules.

## Guardrail 3 — Database Access Uses Repositories

No direct SQLite access from UI. Persistence must flow through approved database packages and repositories.

## Guardrail 4 — Events Are First-Class

Important actions become events. Events must use typed contracts.

## Guardrail 5 — State Machines Own State Transitions

Mission, Campaign, Guardian, Operator, Archive, Recovery, and HQ state transitions must be explicit.

## Guardrail 6 — AI Is Rule-Based First

AI departments begin as deterministic, explainable, rule-based systems. LLM usage is optional, later, and must not control trading decisions.

## Guardrail 7 — No Hidden Global State

Shared state must be explicit, typed, and owned by a package or service.

## Guardrail 8 — Institutional Language Is Protected

UI text and AI messages must respect Headquarters language. Casual trading-app language must not leak into core screens.

## Guardrail 9 — No Market Prediction

Headquarters evaluates behavior, doctrine, and process. It does not predict markets or issue trade signals.

## Guardrail 10 — Local-First Data

Operator data must remain local-first unless a future approved sync architecture exists.

## Guardrail 11 — Every New System Needs a Spec

If a new system is required, update HDR/HTB/HIG or create an ACR before implementation.

## Guardrail 12 — Accessibility Is Not Optional

Motion, audio, and atmospheric effects must have fallbacks or controls where required.
