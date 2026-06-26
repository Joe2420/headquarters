# Initial Source Trees v0.4

Owner: Engineering
Status: Engineering Ready
Priority: P0

## apps/desktop

```text
apps/desktop/src/
├── main/
│   ├── main.ts
│   ├── window.ts
│   └── ipc.ts
├── preload/
│   └── index.ts
└── renderer/
    ├── App.tsx
    ├── routes.tsx
    ├── rooms/
    │   ├── SecurityCheckpoint.tsx
    │   ├── CommandCenter.tsx
    │   └── PlaceholderRoom.tsx
    └── styles/
        └── globals.css
```

## packages/hqos

```text
packages/hqos/src/
├── events/
│   ├── EventBus.ts
│   ├── EventEnvelope.ts
│   └── eventCatalog.ts
├── services/
│   ├── ServiceRegistry.ts
│   └── HQOSKernel.ts
├── state/
│   ├── missionState.ts
│   ├── operatorState.ts
│   ├── guardianState.ts
│   └── headquartersState.ts
└── index.ts
```

## packages/database

```text
packages/database/src/
├── connection.ts
├── migrations/
│   └── 0001_initial.sql
├── migrator.ts
├── repositories/
│   ├── EventRepository.ts
│   ├── MissionRepository.ts
│   └── OperatorRepository.ts
└── index.ts
```

## packages/domain

```text
packages/domain/src/
├── ids.ts
├── events.ts
├── mission.ts
├── operator.ts
├── guardian.ts
├── archive.ts
└── index.ts
```
