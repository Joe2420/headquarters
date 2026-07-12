# Sprint 45 - Operational Consequences and Recovery Review

## Scope

Sprint 45 established deterministic operational consequences and recovery handling without adding AI, prediction, or profit-based judgment.

The sprint keeps authoritative consequence policy in HQOS/application code and limits the desktop renderer to presentation, Commander wording, and room surfaces.

## Completed Work

### Operational Consequence Contract

- Added typed operational consequence contracts.
- Added consequence categories, severities, statuses, recovery requirements, and helper functions.
- Consequences are deterministic and evidence referenced.

### Consequence Derivation Engine

- Added a pure derivation engine for mission evaluation, Guardian, persistence, doctrine, and prior-pattern signals.
- Mission evaluation remains the source for process failure, unresolved contradiction, missing protective rule, and incomplete debrief consequences.
- Financial outcome cannot override process quality.

### Consequence Persistence

- Added SQLite migration support for operational consequences.
- Added repository functions to save, update, resolve, list active/blocking, and list historical consequences.
- Recovery progress is stored in the consequence payload.

### Guardian Integration

- Guardian signals can derive consequence candidates.
- Guardian-derived consequences include Commander-facing signals and recovery candidates.
- Guardian lockouts remain blocking; lower-severity alerts remain reviewable without panic language.

### Lifecycle Enforcement

- Added selectors for consequence-based gating.
- War Room entry, authorization request, deployment, debrief completion, and archive completion can be checked against active blocking consequences.
- Required recovery actions are exposed deterministically.

### Recovery Workflow

- Added a recovery service for accepting evidence, rejecting invalid evidence, and resolving consequences when all evidence requirements are satisfied.
- Partial recovery remains active.
- Future-adherence requirements remain pending until future evidence exists.

### Commander and Desktop Experience

- Added Commander consequence dialogue helpers.
- Added sidebar consequence review affordance.
- Added Guardian room consequence recovery surface.
- Desktop consequence display now adapts authoritative HQOS consequence output instead of owning the policy.

## Architecture Notes

- HQOS owns consequence contracts, derivation, recovery, selectors, and persistence-facing repository behavior.
- Desktop owns only presentation adapters and Commander wording.
- Archive persistence can consume the authoritative evaluation/consequence result.
- No EventBus publishing was added.
- No AI, prediction, or trading outcome authority was introduced.

## Validation Expectations

- Consequences must be repeatable for the same evidence.
- Renderer components must display consequence results rather than define authoritative policy.
- Recovery must require evidence when a recovery requirement says evidence is required.
- Guardian lockouts must remain blocking until recovered.

## Remaining Gaps

- Full archive-facing consequence history views can be deepened.
- Commander recovery guidance can become more contextual once institutional health work expands.
- Future clients should consume the HQOS consequence contracts directly.

## Recommendation

Proceed to the next approved sprint focused on Institutional Health Model once Founder inspection approves this branch.
