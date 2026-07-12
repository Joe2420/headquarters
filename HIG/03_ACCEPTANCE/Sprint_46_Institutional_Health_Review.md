# Sprint 46 — Headquarters Institutional Health Model Review

## Summary

Sprint 46 establishes an authoritative, deterministic Institutional Health model in HQOS.

The renderer no longer owns the health policy. Desktop surfaces display health results from HQOS and keep presentation logic local.

## Health Model

The model defines eight explainable dimensions:

- Operational Readiness
- Mission Integrity
- Intelligence Completeness
- Evidence Quality
- Guardian Stability
- Doctrine Coverage
- Academy Development
- Archive Integrity

Each dimension includes:

- state
- trend
- explanation
- supporting evidence
- contributing systems
- last updated timestamp

## Calculation Engine

`InstitutionalHealthEngine` derives condition from approved Headquarters evidence:

- Mission Evaluation
- Operational Consequences
- Guardian state
- Doctrine coverage
- Academy evidence
- Mission lifecycle
- Archive readiness
- Mission intelligence
- Priority state

The engine does not replace Mission Evaluation rules. Mission Evaluation remains the authority for mission outcome and process evaluation.

## Explanation Engine

Every dimension explains:

- why the condition exists
- which evidence supports it
- which factors block operation
- which factors improve condition

No health state is emitted without supporting evidence.

## Trend Engine

Health trends compare previous and current snapshots.

Supported trends:

- improving
- stable
- declining

## Priority Integration

The Headquarters Priority Engine now consumes Institutional Health.

Critical or degraded health dimensions can generate priority items. Health does not speak directly; Commander and UI surfaces explain the result.

## Commander Integration

Commander receives a health briefing adapter that summarizes only meaningful changes.

The briefing avoids raw counters and converts the HQOS snapshot into operational language.

## Sidebar Integration

The desktop mission sidebar now presents the section as:

`HEADQUARTERS CONDITION`

It displays state, explanation, and evidence while leaving calculation authority in HQOS.

## History

Institutional health snapshots and health history have a migration and repository foundation.

History records:

- timestamp
- changed dimension
- old state
- new state
- cause
- source evidence

## Validation Scope

Targeted validation added:

- HQOS health engine tests
- HQOS health repository tests
- Priority integration tests
- Commander health briefing tests
- Desktop App sidebar tests

## Remaining Gaps

- Desktop does not yet show historical health trend charts.
- Health history is ready for Archive and replay consumption, but no Archive UI has been added in this sprint.
- Future sprints may use health snapshots to drive more advanced Commander timing and recovery guidance.
