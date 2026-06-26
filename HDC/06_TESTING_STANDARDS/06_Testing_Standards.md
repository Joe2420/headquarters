# Testing Standards

## Testing Philosophy

Headquarters must be reliable because it becomes part of the Operator's professional environment.

Tests protect institutional trust.

## Required Test Types

### Unit Tests

Used for reducers, event validation, domain logic, state machines, repositories, and service methods.

### Integration Tests

Used for workflows that cross package boundaries, including HQOS events, persistence, mission lifecycle, and archive writes.

### Golden Path Tests

Used for major UX journeys such as startup, report for duty, mission creation, authorization, debrief, archive, and shutdown.

### Event Replay Tests

Used to verify that event streams can reconstruct mission state.

### Regression Tests

Required for bugs affecting mission state, archive integrity, event handling, or operator data.

## Minimum Test Expectations

Every core package must include tests before it is considered complete.

Every event contract must include validation tests.

Every state machine must include transition tests.

Every database migration must be testable against a clean database.

## Test Failure Rule

If tests fail, Codex stops and reports the failure.
Codex must not continue into unrelated work.
