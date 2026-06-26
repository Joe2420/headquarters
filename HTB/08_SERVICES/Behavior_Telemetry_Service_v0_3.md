# Behavior Telemetry Service v0.3

Status: Engineering Ready
Owner: Operator Systems

## Purpose
Captures behavioral events required for Identity Drift, Decision DNA, Artificial Horizon, Black Box, Guardian, and Judgment Reserve.

## Captured Signals v1
- observation duration
- checklist completion
- authorization requests
- authorization denials
- override requests
- recovery windows
- debrief completion
- rule negotiation phrases
- mission state changes
- declared command authority
- decision latency

## Deferred Signals
Mouse speed, tab switching, and chart-switch telemetry are deferred until privacy and OS compatibility are reviewed.

## Acceptance Criteria
Behavior telemetry must be local-first, explainable, and opt-in for sensitive passive signals.
