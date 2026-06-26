# Component Implementation Specification v0.3

Status: Engineering Ready
Owner: Interface

## Core Components for Milestone 1
- AppShell
- RoomViewport
- CommandChairStatus
- MissionBoard
- MissionClock
- CommandButton
- BriefingPanel
- ObservationTimer
- AuthorizationPanel
- GuardianStatusPanel
- DebriefForm
- ArchiveCard
- TimelineEventList
- CompassIndicator
- ArtificialHorizon

## Component Rules
- Components receive props only from state selectors.
- Components dispatch typed commands, not raw mutations.
- Components do not import database code.
- Components must support reduced-motion mode.

## Acceptance Criteria
Every component includes Storybook or equivalent isolated demo before integration.
