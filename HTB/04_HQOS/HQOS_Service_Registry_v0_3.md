# HQOS Service Registry v0.3

Status: Engineering Ready
Owner: Engineering

## Purpose
Defines the initial services managed by HQOS. Services are initialized during boot and communicate through the event bus.

## Core Services

### EventBusService
Publishes and subscribes to typed Headquarters events.

### StateMachineService
Owns mission, campaign, operator, guardian, recovery, and institution state machines.

### MissionService
Creates, updates, completes, and archives missions.

### OperatorModelService
Maintains current Operator Model snapshot.

### BehaviorTelemetryService
Records behavioral telemetry events: waiting, override requests, checklist status, command transitions, decision latency, observation time.

### GuardianService
Evaluates capital, judgment, and behavioral risk.

### ArchiveService
Writes Mission Reports, Behavior Reports, Decision Reports, Intelligence Reports, and Doctrine Reports.

### CouncilService
Routes significant events through department evaluation.

### EnvironmentService
Controls room state, lighting profile, audio profile, atmosphere tokens, and transition rules.

### RecognitionService
Detects invisible victories and restraint events.

### RecoveryService
Tracks fatigue, recovery windows, and mission readiness.

### DoctrineService
Loads active doctrine, resolves applicable rules, and stores doctrine review outcomes.

## Initialization Order
1. DatabaseService
2. MigrationService
3. EventBusService
4. StateMachineService
5. ArchiveService
6. OperatorModelService
7. MissionService
8. Department services
9. EnvironmentService
10. UI Bridge

## Acceptance Criteria
HQOS boot fails safely if any core service fails. Optional services may degrade without blocking local journaling and archiving.
