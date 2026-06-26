# Project Scaffold Plan v0.4

Owner: Engineering
Status: Engineering Ready
Priority: P0

## Purpose
Define the initial implementation scaffold for Headquarters before any feature logic is built.

## Monorepo Layout

```text
Headquarters/
├── apps/
│   └── desktop/
├── packages/
│   ├── hqos/
│   ├── database/
│   ├── domain/
│   ├── ui/
│   ├── ai-runtime/
│   ├── assets/
│   └── config/
├── tools/
│   ├── migrations/
│   ├── registry/
│   └── dev-scripts/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── golden-path/
├── HDR/
└── HTB/
```

## Required First Principle
The application may not implement business features before the following are present:

1. TypeScript strict mode.
2. Shared domain models.
3. HQOS event bus.
4. SQLite connection layer.
5. Migration runner.
6. Mission state machine shell.
7. Desktop shell with room navigation placeholder.
8. Event logging into the archive.

## Acceptance Criteria
- Repository opens in VS Code without missing folders.
- `npm install` or equivalent package install succeeds.
- Desktop app can launch to a placeholder Security Checkpoint screen.
- HQOS can publish and record a `system.boot.completed` event.
- SQLite database is created locally.
- First migration runs successfully.
