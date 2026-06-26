# Sprint 2 — Mission Core Checklist v0.4

Owner: Engineering
Status: Planned
Priority: P0

## Goal
Create the first usable mission lifecycle without advanced AI.

## Tasks

### Mission State
- Implement mission states: idle, briefing, observation, authorization, deployed, debrief, archived.
- Persist mission state changes as events.
- Add mission creation and completion repositories.

### UI
- Implement Command Center basic layout.
- Implement Mission Board component.
- Implement Ready Room placeholder.
- Implement Observation Room timer.
- Implement Authorization Terminal placeholder.
- Implement Debrief form placeholder.

### Guardian Stub
- Implement rule-based Guardian stub.
- Guardian can return: allow, caution, deny, stand_down_recommended.

### Commander Stub
- Implement Commander response generator with fixed phrase library.
- Commander never predicts market direction.

### Archive
- Persist Mission Report.
- Persist Mission Events.
- Display archived mission list.

## Exit Criteria
Sprint 2 is complete when a user can create a mission, move through briefing → observation → authorization → debrief → archive, and all state transitions are persisted.
