# Electron IPC Contract v0.3

Status: Engineering Ready
Owner: Engineering

## Purpose
Defines the secure bridge between Electron renderer and main process.

## Security Rules
- contextIsolation enabled.
- nodeIntegration disabled.
- Renderer has no direct filesystem access.
- Renderer has no direct SQLite access.
- All IPC channels are allowlisted.

## IPC Channels

### hqos:dispatch-event
Renderer requests an HQOS event.
Payload: EventEnvelope
Response: DispatchResult

### mission:create
Creates a new mission.
Payload: CreateMissionRequest
Response: MissionRecord

### mission:update-state
Requests a mission state transition.
Payload: MissionTransitionRequest
Response: StateTransitionResult

### archive:write
Writes an archive artifact.
Payload: ArchiveWriteRequest
Response: ArchiveWriteResult

### archive:search
Searches local archives.
Payload: ArchiveSearchRequest
Response: ArchiveSearchResult[]

### db:backup
Creates a local backup.
Payload: BackupRequest
Response: BackupResult

### system:get-status
Returns boot, database, HQOS, and migration status.
Payload: none
Response: SystemStatus

## Rejected Channels
- arbitrary-sql
- read-file
- write-file
- shell-exec
- open-external without confirmation

## Acceptance Criteria
Every IPC channel has a TypeScript type, runtime validation, and test coverage.
