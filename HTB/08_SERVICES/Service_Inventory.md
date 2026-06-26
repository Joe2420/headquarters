# Service Inventory

    **Owner:** Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Required services:

- MissionService
- CampaignService
- OperatorModelService
- BehaviorEngineService
- GuardianService
- CommanderService
- HistorianService
- GhostService
- ArchiveService
- DoctrineService
- DebriefService
- RecognitionService
- AudioService
- LightingService
- RoomNavigationService
- AssetRegistryService
- NightOperationsService
- SettingsService

Each service must expose typed commands and subscribe to relevant events. Services do not mutate global state directly; they emit events or use repositories.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
