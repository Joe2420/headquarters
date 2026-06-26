# Database Repository Pattern v0.3

Status: Engineering Ready
Owner: Database

## Purpose
Defines how application code interacts with SQLite. UI components and AI departments never execute SQL directly.

## Repositories
- MissionRepository
- CampaignRepository
- EventRepository
- BehaviorRepository
- OperatorModelRepository
- GuardianRepository
- ArchiveRepository
- DoctrineRepository
- DepartmentMessageRepository
- AssetRepository
- SettingsRepository

## Rules
- All writes occur through repositories.
- Every write is wrapped in a transaction when it touches more than one table.
- Every repository method returns domain objects, not raw rows.
- Migrations are append-only.
- Deleted records are soft-deleted unless they are temporary cache records.

## Example Method Set

```ts
interface MissionRepository {
  create(input: CreateMissionInput): Promise<Mission>;
  findById(id: string): Promise<Mission | null>;
  updateState(id: string, state: MissionState): Promise<void>;
  listByCampaign(campaignId: string): Promise<Mission[]>;
}
```

## Acceptance Criteria
Database logic is covered by unit tests using an in-memory SQLite database and fixture migrations.
