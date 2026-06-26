# Package Boundaries v0.3

Status: Engineering Ready
Owner: Engineering

## Purpose
Defines the monorepo package boundaries for the first implementation. Headquarters must be modular from day one so HQOS, database, AI runtime, and UI components can be tested independently.

## Required Packages

### apps/desktop
Electron desktop application. Owns window creation, preload bridge, local file paths, and packaging.

### packages/hqos
Institution kernel. Owns event bus, heartbeat, state machine orchestration, command dispatching, and service registry.

### packages/database
SQLite access layer, migrations, repositories, query helpers, and backup routines.

### packages/domain
Shared domain models: Mission, Campaign, OperatorModel, Doctrine, ArchiveRecord, GuardianIntervention, DepartmentMessage.

### packages/ai-runtime
Department runtime, Council orchestration, rule-based inference layer, prompt adapters for future LLM integration, confidence scoring.

### packages/ui
Reusable React components: CommandButton, MissionBoard, Compass, ArtificialHorizon, Timeline, ArchiveCard, GuardianPanel.

### packages/design-tokens
Colors, spacing, typography, motion durations, room lighting tokens, audio priority constants.

### packages/assets
Local references and manifest files for audio, textures, icons, room backgrounds, and future generated art.

### packages/testing
Shared test utilities, fake HQOS clock, event fixtures, database fixtures, UI harnesses.

## Boundary Rules
- UI cannot write directly to SQLite.
- AI runtime cannot mutate state directly; it publishes recommendations through HQOS events.
- Database package cannot import React or Electron.
- HQOS cannot depend on UI components.
- Domain package has no runtime side effects.
- Electron main process exposes only typed IPC commands.

## Acceptance Criteria
- Each package can run unit tests independently.
- Circular imports are forbidden.
- All cross-package communication uses domain types or event contracts.
