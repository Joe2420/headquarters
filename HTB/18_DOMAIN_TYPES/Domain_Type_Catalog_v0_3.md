# Domain Type Catalog v0.3

Status: Engineering Ready
Owner: Domain

## Core Domain Types
- Operator
- OperatorModelSnapshot
- Mission
- MissionState
- Campaign
- CampaignState
- Doctrine
- DoctrineConfidence
- Department
- DepartmentMessage
- EventEnvelope
- GuardianState
- ArchiveArtifact
- BehaviorEvent
- IdentitySnapshot
- RecoveryWindow
- RecognitionRecord

## Rule
Domain types are shared between renderer, HQOS, database repositories, and AI runtime. They must remain serializable.
