# Event Envelope Specification v0.3

Status: Engineering Ready
Owner: HQOS

## Purpose
All events in Headquarters use one envelope shape. This ensures traceability, replayability, archive integrity, and deterministic testing.

## Event Envelope

```ts
interface EventEnvelope<TPayload = unknown> {
  id: string;
  type: HeadquartersEventType;
  version: number;
  occurredAt: string;
  source: EventSource;
  missionId?: string;
  campaignId?: string;
  correlationId?: string;
  causationId?: string;
  priority: 'white' | 'green' | 'amber' | 'red' | 'black';
  payload: TPayload;
}
```

## Required Fields
- id: UUID.
- type: canonical event name.
- version: event schema version.
- occurredAt: ISO timestamp.
- source: department, service, or UI origin.
- priority: operational priority.

## Event Replay Rule
Every archived mission must be reconstructable from its event stream plus current schema migrations.

## Event Naming Convention
`domain.action.past_tense`

Examples:
- mission.created
- mission.authorized
- guardian.intervention_recommended
- operator.identity_drift_detected
- archive.artifact_written
- doctrine.review_requested

## Acceptance Criteria
No service receives untyped payloads. Invalid event envelopes are rejected and logged as engineering anomalies.
