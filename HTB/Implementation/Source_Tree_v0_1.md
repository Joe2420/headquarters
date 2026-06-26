# Source Tree v0.1

```text
Headquarters/
├── apps/
│   └── desktop/
├── packages/
│   ├── shared/
│   ├── hqos/
│   ├── database/
│   ├── ai-runtime/
│   └── ui/
├── tools/
│   └── scripts/
├── HDR/
└── HTB/
```

## Package Responsibilities
- `apps/desktop`: Electron shell and renderer.
- `packages/shared`: shared domain types and event definitions.
- `packages/hqos`: event bus, state store, mission kernel.
- `packages/database`: SQLite migrations and repository interfaces.
- `packages/ai-runtime`: AI department contracts and rule-based runtime stubs.
- `packages/ui`: reusable React components.
