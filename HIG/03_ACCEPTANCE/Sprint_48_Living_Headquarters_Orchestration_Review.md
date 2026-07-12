# Sprint 48 - Living Headquarters Orchestration Review

## Summary

Sprint 48 introduces the deterministic Living Headquarters orchestration layer.

Subsystems do not speak directly to the operator. They create evidence-backed attention requests. The orchestrator decides whether a request may surface, queues optional work, preserves current mission context, and keeps Commander as the only conversational voice.

## Attention Request Contract

Authoritative contract:

- `HeadquartersAttentionRequest`
- `HeadquartersAttentionRequestAdapters`
- `HeadquartersInterruptionSession`
- `LivingHeadquartersOrchestrator`
- `LivingHeadquartersHistory`

Every request includes source subsystem, request type, urgency, severity, status, recommended room, recommended action, evidence references, interruption policy, return context, and deduplication key.

Requests are not chat messages.

## Subsystem Adapters

Adapters translate approved subsystem state into request candidates:

- Guardian lockout and warnings
- Doctrine candidates, revisions, and conflicts
- Journal follow-ups
- Academy recognition and training recommendations
- Intelligence contradictions and missing evidence
- Archive reviews
- Institutional health degradation
- Operational consequences and recovery
- Mission recovery and persistence issues

Adapters do not recreate subsystem rules. They preserve evidence references and produce no request when source state is resolved or lacks evidence.

## Orchestration Decision Rules

The orchestrator consumes lifecycle projection, priority items, pending requests, conversation state, runtime transition state, institutional health, Commander relationship, consequences, and Guardian state.

It returns a `LivingHeadquartersDecision` with:

- highest eligible request
- queued requests
- request to surface
- interruption allowance and reason
- Commander intent
- recommended room and action
- preserved context
- return plan
- next evaluation time or no-op reason

No actionable request produces a stable standby decision.

## Safe Interruption Policy

Non-critical requests cannot interrupt when:

- a Commander question is awaiting an answer
- input submission is active
- a transition is running
- authorization is mid-evaluation
- archive save is in progress
- the request policy is background-only, queued, or next-brief-only

Critical Guardian lockout, mission recovery, and persistence recovery may override normal safe points while preserving context.

## Interruption Session Persistence

`HeadquartersInterruptionSession` captures:

- active attention request
- source context
- Commander question snapshot
- lifecycle snapshot
- mission context revision
- interruption room/view
- return context
- resolution result
- reload recovery state

The model serializes and hydrates deterministically so a future storage layer can persist active interruption sessions without renderer ownership.

## Commander Dialogue Integration

Desktop now has a Commander interruption dialogue adapter.

Commander explains:

- what requested attention
- why it matters
- whether it blocks the operation
- what action is required
- where the operator will return

Subsystems may be named, but only Commander speaks.

## Cross-Room Workflows

Reusable workflow models were added for:

- Guardian interruption and return
- Doctrine review
- Journal follow-up
- Academy recognition
- Intelligence contradiction clarification

The workflow layer returns available actions and resolution status without duplicating subsystem persistence rules.

## Request Center

Desktop includes a quiet Headquarters Request Center model/component with:

- Requires Attention
- Queued
- Deferred
- Recently Resolved
- Background Activity

Critical requests cannot be silently dismissed. Routine requests can be deferred when policy allows.

## Session Opening

Commander session opening now selects:

- continuity
- one highest priority
- at most two secondary items
- one recommended action
- one optional relationship statement

Already-briefed requests are suppressed to prevent repeated openings.

## Audit History

`LivingHeadquartersHistory` records:

- request creation
- priority/queue/surface events
- interruptions
- room transfers
- actions
- resolutions
- returns
- deferrals
- expiration and supersession

History queries support mission, subsystem, unresolved requests, completed interruptions, reconstruction, interruption explanation, deferral explanation, and mission dossier summaries.

## Known Limitations

- The current Sprint 48 storage boundary is deterministic serialization and projection-focused; persistent database repositories for orchestration records remain future work.
- Request Center is reusable and tested but not yet deeply embedded into every room surface.
- Manual desktop scenario verification was limited to startup smoke behavior in this sprint.

## Next Recommendation

Proceed with the next sprint only after Founder review confirms the orchestration model matches the intended operational experience.
