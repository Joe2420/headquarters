# Sprint 32 - Persistent Mission Intelligence and Operational Memory Review

## Scope

Sprint 32 persists the mission context memory used by Commander, Current Room surfaces, and the Mission Intelligence Package.

This sprint does not add AI, prediction, new room behavior, or a new Commander personality layer. It preserves the existing deterministic conversation model and adds reload-safe evidence memory.

## Persistence

Mission context is stored in:

`mission_context_records`

Each record is keyed by mission id and stores a JSON mission-context snapshot with created and updated timestamps.

## Runtime Integration

The desktop startup runtime now exposes:

- list mission contexts
- save mission context

The renderer loads persisted context records during startup, maps them by mission id, and hydrates active missions with:

- Ready Room briefing answers
- Observation evidence answers
- readiness flags
- Commander notes
- contradiction flags

## Commander and Room Behavior

Accepted Ready Room and Observation answers are saved immediately after they are accepted.

On reload, Commander and room views receive the same restored mission context, so previously answered fields remain present and the Mission Intelligence Package does not regress to missing evidence.

## Confidence and Missing Evidence

Mission Intelligence confidence remains deterministic and continues to derive from the same evidence requirements. The change is that evidence is now reload-safe.

## Acceptance Notes

- Accepted mission context persists by mission id.
- Reload hydrates briefing and observation context.
- Current Room and Commander consume the same restored context.
- Missing evidence detection respects restored answers.
- The database repository remains generic and does not depend on desktop renderer types.

## Remaining Gaps

- Authorization and Debrief field revision history are still represented through existing mission/debrief state, not a full per-field revision ledger.
- Full archive serialization of the final Mission Intelligence Package remains a future integration point.

## Recommendation

Proceed to the next dependency sprint: Adaptive Commander Personality and Dialogue Engine.

