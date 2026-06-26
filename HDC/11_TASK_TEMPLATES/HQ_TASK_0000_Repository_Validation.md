# HQ-TASK-0000 — Repository Validation

## Estimated Time

2–4 hours.

## Purpose

Validate that the repository is ready for implementation before production coding begins.

## Source References

- HDR v1.0 Design Freeze
- HTB v0.5
- HIG v0.1
- HDC v0.1

## Scope

Codex must inspect the project structure and verify readiness.

## Deliverables

- Repository validation report.
- List of missing folders or files.
- Package dependency verification.
- Build tooling verification.
- TypeScript configuration verification.
- Test runner verification.
- Initial risk list.

## Acceptance Criteria

- Repository structure matches HTB/HIG expectations.
- No required top-level folders are missing.
- Package manager configuration exists.
- TypeScript base configuration exists.
- App and package boundaries are clear.
- No coding work beyond validation is performed.

## Out of Scope

- Do not build application features.
- Do not implement UI.
- Do not implement database logic.
- Do not change architecture.

## Codex Stop Rule

After producing the validation report, stop and wait for approval.
