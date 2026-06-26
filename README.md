# Headquarters

Headquarters is a local-first desktop operating environment for disciplined discretionary execution.

This repository contains:
- `HDR/` - Headquarters Design Repository.
- `HTB/` - Headquarters Technical Blueprint.
- `apps/desktop/` - Electron desktop app.
- `packages/` - reusable architecture packages.

## Start
Use Corepack to activate the pinned pnpm version before installing dependencies.

```bash
corepack enable
corepack prepare pnpm@9.0.0 --activate
corepack pnpm install
corepack pnpm dev
```

## Core Rule
Headquarters does not place trades, predict markets, or replace the Operator's judgment.

## Implementation Control

The repository now includes the Headquarters Implementation Guide (HIG).

Codex and any developer must use the HIG before coding. Headquarters must be implemented as a sequence of 2-4 hour engineering tasks. Each task ends with a verification report and requires explicit approval before the next task begins.

Do not ask Codex to build the full product at once.

## HDC - Development Constitution

The repository now includes `HDC/`, the final pre-code governance layer. HDC defines Codex behavior, task boundaries, approval gates, definition of done, testing rules, architecture guardrails, emergency procedures, and Architecture Change Requests.

Coding must begin with `HQ-TASK-0000 - Repository Validation`. Every implementation task must remain within a 2-4 hour scope and must stop for approval before continuing.