# Codex Handoff — Sprint 1 v0.4

Use this prompt when handing Sprint 1 to Codex.

```text
You are implementing Headquarters Sprint 1: Foundation.

Use the HTB documents as source of truth.

Do not invent features.
Do not implement trading logic.
Do not implement market prediction.
Do not add social or engagement features.

Build a TypeScript monorepo with:
- Electron desktop app
- React renderer
- SQLite local database
- packages/domain
- packages/database
- packages/hqos
- packages/ui
- packages/ai-runtime

Implement:
- strict TypeScript configuration
- Electron boot to Security Checkpoint placeholder
- HQOS EventBus
- ServiceRegistry
- SQLite connection and migration runner
- initial schema migration
- boot event logging
- minimal tests for EventBus and migration runner

Acceptance criteria:
- app launches locally
- database is created
- migration runs
- HQOS emits and persists boot events
- UI shows Security Checkpoint placeholder

Do not proceed to Sprint 2 until Sprint 1 acceptance criteria pass.
```
```
