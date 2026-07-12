# Sprint 50 - Mission Replay & After-Action Review System

## Architecture

Sprint 50 introduced Mission Replay as a deterministic reconstruction layer rather than a log viewer. The authoritative replay model and replay engine live in `packages/hqos`, outside React, so replay construction is reusable by desktop, Archive, Commander, Academy, Guardian, Doctrine, replay, and future clients.

Renderer additions are presentation adapters only:

- Commander replay narration
- Replay timeline experience
- Decision review surface
- Replay insights
- Replay export DTOs

## Replay Engine

The HQOS replay engine consumes authoritative mission evidence:

- Mission lifecycle projection
- Mission evaluation
- Operational consequences
- Living Headquarters history
- Persisted evidence records

It produces one ordered `MissionReplay` containing immutable replay events, sections, narration, bookmarks, recommendations, and summary data. Identical input evidence produces identical replay output.

## Evidence Rules

- Replay never invents events.
- Replay events reference persisted evidence identifiers.
- Mission evaluation remains authoritative.
- Operational consequences remain authoritative.
- Replay is read-only and does not modify history.
- Export is read-only and deterministic.

## Desktop Experience

The desktop now has reusable replay surfaces for:

- Commander after-action narration
- Sectioned replay timeline with bookmarks and progress
- Decision review with supporting evidence
- Deterministic replay highlights
- JSON, Markdown, and PDF-ready report export structures

## Manual Review Scenarios

- Complete successful mission: replay can reconstruct lifecycle, evaluation, and recommendation evidence.
- Disciplined losing mission: replay can preserve process quality separately from outcome.
- Guardian interruption: replay can include Guardian/living Headquarters evidence without subsystem narration.
- Recovery mission: replay can include operational consequences and recovery events.
- Archived mission: replay summary and export remain read-only.
- Reload replay: replay engine is deterministic from persisted evidence and does not require renderer state.

## Validation Required

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @headquarters/desktop dev`

## Remaining Work Before Sprint 51

- Wire replay surfaces into the Archive/Debrief desktop flow after Founder inspection.
- Add repository-backed replay loading once persisted replay read APIs are approved.
- Add richer replay evidence adapters for journal, doctrine, academy, and Guardian repositories as those contracts are finalized.
- Add visual polish for replay playback controls after the core deterministic model is accepted.
