# Sprint 1 — Foundation Checklist v0.4

Owner: Engineering
Status: Ready
Priority: P0

## Goal
Create the runnable local-first application foundation.

## Tasks

### Repository
- Create monorepo structure.
- Configure package manager workspace.
- Configure TypeScript strict mode.
- Configure linting and formatting.

### Desktop Shell
- Create Electron main process.
- Create preload bridge.
- Create React renderer.
- Display Security Checkpoint placeholder.
- Display Command Center placeholder.

### Database
- Add SQLite dependency.
- Create local app data folder.
- Create migration runner.
- Implement `0001_initial.sql`.
- Verify database creation on boot.

### HQOS
- Implement EventEnvelope type.
- Implement EventBus.
- Implement ServiceRegistry.
- Implement HQOSKernel boot sequence.
- Publish `system.boot.started` and `system.boot.completed`.

### Testing
- Unit test EventBus.
- Unit test migration runner.
- Golden path test: app boot creates database and records boot event.

## Exit Criteria
Sprint 1 is complete when the desktop app launches, creates a database, boots HQOS, records initial events, and displays the Security Checkpoint screen.
