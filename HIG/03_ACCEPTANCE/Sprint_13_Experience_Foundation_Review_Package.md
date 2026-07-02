# Sprint 13 Experience Foundation Review Package

## What Was Defined

- Headquarters experience principles for Commander-led room operation.
- Commander shell architecture as the persistent wrapper around rooms.
- Deterministic Commander message model.
- Room state machine and mission room recommendation path.
- Mission Compass component specification.
- Door Transition component specification.
- Command Chair component specification.

## What Was Implemented

- Renderer Commander shell state helper and tests.
- Renderer Commander message model helper and tests.
- Renderer room state machine helper and tests.
- Basic Mission Compass component and tests.
- Basic Door Transition component and tests.
- Upgraded Command Chair component and tests.

## What Remains For Sprint 14

- Integrate Commander shell state into the visible desktop shell.
- Render Commander guidance as the primary experience layer.
- Use room recommendation to guide entry while keeping sidebar recovery access.
- Introduce room transition visuals with reduced-motion support.
- Place Mission Compass and Command Chair inside the Commander-led shell hierarchy.
- Reduce dashboard density room by room without removing existing workflows.

## Risks

- Existing beta UI still feels navigation-first until Sprint 14 integrates the shell foundation.
- Current room content remains dense because Sprint 13 intentionally avoided a broad UI rebuild.
- New foundations must be adopted consistently or they may become unused parallel abstractions.
- Room IDs differ from some legacy sidebar labels, so future integration must map old navigation IDs carefully.

## Non-Negotiable UX Rules

- Commander guidance comes first.
- Sidebar navigation remains secondary.
- Rooms are entered, not selected.
- One primary action dominates the current state.
- Future actions stay hidden, locked, or quiet.
- No dashboard density.
- No all-at-once subsystem dumping.
- Atmosphere remains calm, institutional, and tactical.
- Headquarters rewards discipline, not profit.
- The operator always knows the next action.

## Backend Confirmation

Sprint 13 did not change backend behavior, HQOS services, database schema, migrations, persistence contracts, or network behavior.

## Recommended Next Sprint

Sprint 14 Commander Experience.

## Validation

Required validation commands for the completed sprint:

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
