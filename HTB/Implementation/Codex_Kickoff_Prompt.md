# Codex Kickoff Prompt — Sprint 1

You are working inside the Headquarters monorepo. Implement only Sprint 1 foundation tasks.

Primary goals:
1. Make the monorepo installable with pnpm.
2. Make the Electron + React desktop shell run.
3. Connect renderer to HQOS through safe IPC.
4. Add the initial SQLite database bootstrap.
5. Keep AI systems rule-based stubs only.
6. Do not implement trading execution, broker integration, or market prediction.

Constraints:
- Local-first.
- No cloud dependency.
- No hidden telemetry.
- No social features.
- No AI trade signals.
- Follow HDR and HTB principles.

Definition of done:
- `pnpm install` succeeds.
- `pnpm typecheck` succeeds.
- `pnpm dev` opens the desktop shell.
- Event bus can emit `hq.boot.started` and `mission.created`.
- Initial database migration can be run.
