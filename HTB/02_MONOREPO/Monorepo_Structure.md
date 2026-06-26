# Monorepo Structure

    **Owner:** Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Canonical repository layout:

```text
Headquarters/
├── HDR/
├── HTB/
├── apps/
│   └── desktop/
├── packages/
│   ├── ui/
│   ├── hqos/
│   ├── database/
│   ├── ai/
│   ├── shared/
│   ├── assets/
│   └── testing/
├── tools/
├── scripts/
├── tests/
└── README.md
```

Package responsibilities:
- `ui`: reusable components and room layouts.
- `hqos`: event bus, state machines, service orchestration.
- `database`: SQLite schema, migrations, repositories.
- `ai`: Commander, Guardian, Ghost, Historian, Council interfaces.
- `shared`: types, constants, design tokens.
- `assets`: sound, textures, icons, room ambience references.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
