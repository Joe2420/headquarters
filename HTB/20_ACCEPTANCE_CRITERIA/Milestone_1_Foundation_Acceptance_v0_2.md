# Milestone 1 Foundation Acceptance Criteria

Milestone 1 proves the core Headquarters runtime works without advanced visuals.

## Required Capabilities
- Create operator profile.
- Create campaign.
- Create mission.
- Move mission through briefing, observation, authorization, deployed, debrief, archive.
- Persist mission events.
- Persist behavior events.
- Capture identity snapshots.
- Generate a Black Box timeline from stored events.
- Create archive artifacts.
- Render Command Center, Ready Room, Observation Room, War Room, Debrief Theater, Archives.

## Required Technical Proofs
- SQLite migration runs from empty database.
- Event bus publishes and persists events.
- Mission state machine prevents invalid transitions.
- UI renders from state, not duplicated local truth.
- Guardian can produce a mock intervention with evidence references.
- Commander can produce a mock one-sentence response from Council assessment.

## Non-Goals
- Broker integration.
- Live market data.
- AI market prediction.
- Full sound design.
- Full 3D environment.
- Multi-user sync.

## Definition of Done
A developer can run the desktop app locally, complete a simulated mission, debrief it, and retrieve the mission from Archives with a coherent Black Box timeline.
