# Navigation Framework MVP

HIG Task: HIG-TASK-025 - Navigation Framework MVP

HQ Task: HQ-TASK-0062 - Navigation Framework MVP

## Scope Confirmed

- The desktop shell has a typed primary navigation model.
- The active Command area is explicit and visible.
- Navigation remains lightweight and non-routing.
- No full room system, Guardian, Academy, routing framework, persistence, EventBus, or database behavior was introduced.

## Verification

- Renderer tests verify the primary navigation renders all current areas.
- Renderer tests verify exactly one active navigation item is derived.
- The navigation model is deterministic and does not execute room transitions.
