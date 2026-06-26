# Event Bus

All major actions are events.

Examples:
- OperatorArrived
- CommandAccepted
- MissionStarted
- ObservationStarted
- AuthorizationRequested
- AuthorizationGranted
- DeploymentConfirmed
- GuardianIntervention
- ReturnToBase
- DebriefCompleted
- MissionArchived
- DoctrineUpdated

Departments subscribe to events instead of directly controlling each other.
