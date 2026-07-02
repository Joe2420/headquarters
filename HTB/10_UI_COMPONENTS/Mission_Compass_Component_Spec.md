# Mission Compass Component Spec

## Purpose

Mission Compass shows where the operator is in the main room path. It supports Commander-led room movement without replacing the sidebar in Sprint 13.

## Rooms Displayed

- Ready Room
- Observation
- War Room
- Debrief
- Archive

## States

- locked
- available
- active
- completed

## Behavior

- Shows a compact ordered path.
- Marks exactly the supplied state for each step.
- Does not animate in Sprint 13.
- Does not trigger room routing.
- Does not expose future actions beyond quiet availability and lock state.

## Accessibility

- The component renders as a named navigation region.
- Each step exposes its room name and state in text.
- State is also available as `data-compass-state` for future tests and styling.

## Implementation Boundary

Sprint 13 may add a basic React component and tests. Future sprints can integrate the component into the Commander shell and attach room transition behavior.
