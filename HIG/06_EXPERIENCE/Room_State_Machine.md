# Room State Machine

## Purpose

The room state machine makes the mission path explicit so Headquarters can guide the operator through rooms instead of relying on sidebar navigation as the primary experience.

## Room IDs

- command
- ready-room
- observation
- war-room
- debrief
- archive
- journal
- doctrine
- academy
- guardian
- intelligence
- settings

## Room States

- locked
- available
- recommended
- active
- completed

## Main Mission Path

1. No mission -> command / mission creation
2. Mission created -> ready-room
3. Briefing complete -> observation
4. Observation complete -> war-room
5. Return to base -> debrief
6. Debrief complete -> archive

## Mission State Mapping

- No mission: `command`
- `idle` or `briefing`: `ready-room`
- `ready` or `observation`: `observation`
- `authorization` or `deployed`: `war-room`
- `return_to_base`: `debrief`
- `debrief` or `archived`: `archive`

## Navigation Boundary

The sidebar remains available as secondary navigation. The recommended room is the primary path indicator; it does not remove the operator's ability to reach support rooms such as Journal, Doctrine, Academy, Guardian, Intelligence, and Settings.

## Implementation Boundary

Sprint 13 adds a renderer helper that can recommend rooms and derive lightweight room state. It does not replace routing, change HQOS behavior, or persist room state.
