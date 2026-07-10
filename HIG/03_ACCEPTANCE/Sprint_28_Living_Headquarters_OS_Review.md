# Sprint 28 - Living Headquarters OS Review

## Scope

Sprint 28 made Headquarters feel continuously operational through deterministic renderer-side OS surfaces.

No AI, network calls, database schema changes, backend rewrites, EventBus changes, or mission lifecycle rewrites were added.

## HQ Broadcast Feed

The Commander shell now exposes a compact Headquarters broadcast feed derived from existing local Headquarters events.

The feed uses mission, Guardian, Intelligence, Academy, Doctrine, Archive, and room events without creating new runtime side effects.

## Command Chair Operating Console

The Command Chair now has an operating-console surface showing:

- current mission phase
- current room
- Commander status
- Guardian status
- mission intelligence
- current objective
- current restriction
- current readiness

The surface is read-only and uses existing mission and Commander state.

## Live Operational Timeline

Every generated Headquarters event can now appear in a compact live operational timeline.

The timeline preserves deterministic event order from the existing Headquarters event engine.

## Headquarters Services

Archive, Guardian, Doctrine, Academy, and Intelligence now expose calm service activity states.

The operator can see Headquarters working without popups, noise, or background network behavior.

## Operational Notifications

Important non-low-priority events now appear as integrated operational notifications.

There are no toast popups. Notifications remain inside the Commander shell.

## Situation Board Refinement

The new operating environment complements the existing Situation Board instead of replacing it.

Mission intelligence, operational awareness, Guardian state, and service status remain separated from Commander chat so the Commander does not become telemetry spam.

## Acceptance Confirmation

- Headquarters appears operational while idle.
- Mission feed and broadcast surfaces are alive from deterministic events.
- Command Chair is now the operating console center.
- Notifications are calm, contextual, and integrated.
- Existing mission, transition, Commander, and subsystem behavior remains unchanged.

## Remaining Gaps

- Service activity is deterministic and local; no real asynchronous service workers were introduced.
- Timeline is event-derived and does not persist a separate OS event history.
- Future sprints may refine visual hierarchy after live use.
