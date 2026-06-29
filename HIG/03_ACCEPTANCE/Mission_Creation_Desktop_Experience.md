# Mission Creation Desktop Experience

HIG Task: HIG-TASK-027 - Mission Creation

HQ Task: HQ-TASK-0064 - Mission Creation

## Scope Confirmed

- Desktop mission creation now uses the startup-owned HQOS mission service when the Electron bridge is available.
- Mission persistence reuses the existing MissionRepository.
- Mission creation event persistence reuses the existing ArchiveRepository through MissionService publishing.
- The renderer maps typed Mission records into the existing Command Center mission context.

## Boundaries

- No future mission workflow steps were introduced.
- No market prediction behavior was introduced.
- No new database schema was introduced.
- No Guardian, Academy, or journal behavior was introduced.

## Verification

- Startup tests verify mission creation through real HQOS services and repositories.
- Renderer tests verify mission record mapping and bridge-backed mission creation.
- Existing local fallback remains deterministic for non-Electron test rendering.
