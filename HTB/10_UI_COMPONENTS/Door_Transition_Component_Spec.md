# Door Transition Component Spec

## Purpose

Door Transition provides the conceptual and technical foundation for moving between Headquarters rooms. In Sprint 13 it is a minimal renderer layer, not a full animation system.

## Props

- fromRoom
- toRoom
- transitionState: idle/opening/open/closing/complete
- label text

## Behavior

- Renders transition text and current state.
- Exposes state through CSS class and data attributes for future animation.
- Does not perform routing.
- Does not block accessibility or keyboard operation.
- Does not add heavy animation in Sprint 13.

## Future Animation Notes

Future sprints may attach short door, corridor, or elevator motion to the same state contract. Motion must respect reduced-motion settings and remain skippable.

## Acceptance Boundary

The component proves a room transition layer can be rendered and tested without changing existing room routing behavior.
