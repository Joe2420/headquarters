# Commander Shell Architecture

## Purpose

Commander is the persistent application shell for Headquarters. Rooms render inside Commander context; Commander is not a card, widget, or optional dashboard panel inside a room.

## Architectural Position

The shell sits above room workspaces and below startup/security gates:

1. Startup and Report for Duty establish access.
2. Commander shell determines current guidance, current room, next action, interruptions, and transition intent.
3. The current room workspace renders only the work appropriate to that state.
4. Sidebar navigation remains secondary recovery and advanced access.

## Shell State

Commander shell state must support:

- current message
- current room
- next action
- secondary actions
- interruption state
- room transition intent

## Room Wrapping Rule

Every future room should be conceptually entered through the Commander shell. A room may own its local workspace controls, but it must not decide the overall next mission action without Commander shell state. Commander guidance appears before room detail in the experience hierarchy.

## Interruption Rule

Interruptions are explicit shell state, not ad hoc banners. A warning, lockout, recovery condition, or integrity issue should mark Commander as interrupted and provide the one action required to resolve or acknowledge it.

## Transition Rule

Room movement should be expressed as intent before it is visually animated. The first renderer foundation may be a typed object only; later sprints can attach door, corridor, or lighting animation to the same transition contract.

## Renderer Foundation

Sprint 13 adds a small reusable renderer model for Commander shell state. It does not redesign the desktop shell, remove existing navigation, or add backend behavior.

## Non-Goals

- No chat model.
- No AI-generated Commander copy.
- No network calls.
- No room routing replacement in this sprint.
- No database schema changes.
