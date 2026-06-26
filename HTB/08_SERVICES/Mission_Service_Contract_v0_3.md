# Mission Service Contract v0.3

Status: Engineering Ready
Owner: Operations

## Responsibilities
- Create mission records.
- Manage mission state transitions.
- Dispatch mission events.
- Coordinate archive artifact generation.
- Provide current mission context to UI and AI departments.

## Public Methods
```ts
createMission(input: CreateMissionInput): Promise<Mission>;
startBriefing(missionId: string): Promise<void>;
completeBriefing(missionId: string): Promise<void>;
startObservation(missionId: string): Promise<void>;
requestAuthorization(missionId: string, input: AuthorizationInput): Promise<AuthorizationResult>;
declareDeployment(missionId: string, input: DeploymentInput): Promise<void>;
completeMission(missionId: string, input: CompleteMissionInput): Promise<void>;
archiveMission(missionId: string): Promise<ArchiveResult>;
```

## Acceptance Criteria
MissionService must never bypass StateMachineService.
