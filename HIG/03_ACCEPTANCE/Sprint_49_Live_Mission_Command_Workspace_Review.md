# Sprint 49 - Live Mission Command Workspace Review

## Scope

Sprint 49 consolidated the Commander-facing workspace around an authoritative mission command view model. The desktop now has a stable Commander workspace contract, a live mission command rail, progressive secondary context, message-purpose hierarchy, and explainable coaching surfaces.

## Authoritative Workspace Model

- Added a Commander workspace snapshot model fed by HQOS lifecycle, priority, attention, health, consequence, and relationship contracts.
- Renderer code displays the snapshot and does not own mission lifecycle or priority policy.
- The same authoritative inputs produce the same workspace mode, primary action, room recommendation, blocker list, and evidence count.

## Commander Workspace Layout

- Added a fixed Commander-first workspace layout with primary briefing, command rail, optional secondary context, and sticky interaction region.
- The layout keeps Commander as the primary workspace and moves secondary details behind structured disclosure.

## Live Mission Command Rail

- Added a live mission command rail driven by the Commander workspace snapshot.
- The rail shows current stage, recommended room, evidence count, primary action, blockers, priority, and institutional health.
- The existing mission command sidebar now renders the new projection-driven rail above its legacy detail sections.

## Commander Message Purpose Hierarchy

- Added semantic Commander message purpose rendering for briefing, guidance, warning, acknowledgement, transition, debrief, recognition, and interruption.
- Purpose styling uses restrained terminal-green hierarchy with warning and recognition accents.

## Interaction Controller

- Added a Commander interaction controller that exposes one primary action at a time.
- Generic "Continue" labels fall back safely to an operational order.
- Busy state disables primary and structured choice controls to prevent duplicate submissions.

## Progressive Disclosure

- Added deterministic conversation disclosure helpers.
- Active phases remain expanded, completed phases collapse, and warning or critical messages remain visible.
- Duplicate prompt entries are deduplicated by stable id, phase, and text.

## Secondary Context Consolidation

- Added a secondary Headquarters context surface for activity, diagnostics, and support context.
- Advanced diagnostics remain hidden unless explicitly requested.

## Commander Memory and Coaching

- Added an explainable Commander coaching surface.
- The surface refuses to make coaching claims without evidence and displays evidence count and relationship confidence.

## Accessibility and Performance

- Added a workspace accessibility contract covering labels, responsive classes, and reduced-motion safety.
- New components are pure, low-cost React/CSS surfaces without polling, network calls, or backend rewrites.

## Validation

Full repository validation is required before Sprint 49 is accepted:

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @headquarters/desktop dev`

## Remaining Gaps

- Future work can progressively replace more legacy sidebar sections with the new workspace components after Founder inspection.
- Future sprints may connect richer attention/interruption sessions into the workspace snapshot as more authoritative HQOS selectors become available.

## Recommendation

Proceed to the next sprint only after the Commander workspace consolidation is visually inspected in desktop dev mode.
