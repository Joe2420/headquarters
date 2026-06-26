# Core Service Contracts v0.2

## MissionService
Responsibilities:
- Create mission.
- Transition mission state.
- Persist mission events.
- Expose current mission state to UI.

Key methods:
```ts
createMission(input: CreateMissionInput): Promise<Mission>
transitionMission(missionId: string, nextState: MissionState, reason: string): Promise<void>
getCurrentMission(): Promise<Mission | null>
```

## ArchiveService
Responsibilities:
- Generate mission artifacts.
- Persist archive records.
- Reconstruct Black Box timeline.

Key methods:
```ts
createArtifact(input: ArchiveArtifactInput): Promise<ArchiveArtifact>
reconstructMissionTimeline(missionId: string): Promise<TimelineEntry[]>
```

## BehaviorService
Responsibilities:
- Receive behavioral signals.
- Compare to baseline.
- Emit identity snapshots.

Key methods:
```ts
recordBehaviorSignal(input: BehaviorSignalInput): Promise<void>
calculateIdentitySnapshot(missionId: string): Promise<IdentitySnapshot>
```

## GuardianService
Responsibilities:
- Evaluate capital/judgment risk.
- Recommend intervention.
- Record intervention outcomes.

Key methods:
```ts
evaluateMissionRisk(missionId: string): Promise<GuardianAssessment>
recommendIntervention(assessment: GuardianAssessment): Promise<GuardianIntervention | null>
```

## DoctrineService
Responsibilities:
- Load active doctrine.
- Match doctrine to mission context.
- Record applications and violations.

## RecommendationService
Responsibilities:
- Store every AI recommendation.
- Track accepted/rejected outcomes.
- Support institutional trust audits.

## Acceptance Criteria
- All services are testable without UI.
- All mutating operations publish HQOS events.
- Service failures return institutional errors, not raw exceptions.
