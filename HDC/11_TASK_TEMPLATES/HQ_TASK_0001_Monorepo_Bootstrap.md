# HQ-TASK-0001 — Monorepo Bootstrap

## Estimated Time

2–4 hours.

## Purpose

Create or verify the minimal monorepo tooling needed to begin Headquarters implementation.

## Dependencies

- HQ-TASK-0000 approved.

## Deliverables

- package manager configuration.
- workspace configuration.
- base TypeScript configuration.
- basic lint/test scripts.
- package folders verified.
- README startup instructions updated.

## Acceptance Criteria

- `pnpm install` works.
- `pnpm test` runs or reports no tests configured in a controlled way.
- `pnpm typecheck` runs or is clearly scaffolded.
- Workspace packages are recognized.
- No app features are implemented.

## Out of Scope

- No mission logic.
- No UI screens.
- No database schema changes beyond existing scaffold verification.

## Codex Stop Rule

Stop after bootstrap and wait for approval.
