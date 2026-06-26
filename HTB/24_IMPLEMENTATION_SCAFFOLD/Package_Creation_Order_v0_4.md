# Package Creation Order v0.4

Owner: Engineering
Status: Engineering Ready
Priority: P0

## Order

### 1. packages/domain
Defines shared TypeScript types and constants. No external dependencies except validation utilities.

### 2. packages/database
Creates SQLite connection, migration runner, repository interfaces, and archive persistence.

### 3. packages/hqos
Implements event bus, service registry, state machines, and heartbeat loop.

### 4. packages/ui
Defines design tokens, primitive components, room shells, layout primitives.

### 5. packages/ai-runtime
Implements rule-based AI department contracts and placeholder decision outputs. No LLM dependency in Sprint 1.

### 6. apps/desktop
Electron application shell, IPC bridge, routing, and integration of packages.

## Engineering Rule
No package may import from `apps/desktop`. Dependencies flow inward toward reusable packages.

## Dependency Direction

```text
apps/desktop
  -> packages/ui
  -> packages/hqos
  -> packages/database
  -> packages/domain
```

AI runtime may depend on domain and hqos contracts, but not on UI.
