# Implementation Kickoff Checklist

## Prerequisites
- Node.js LTS installed.
- pnpm installed globally: `npm install -g pnpm`.
- VS Code installed.
- Git installed.

## First Commands
```bash
cd Headquarters
pnpm install
pnpm typecheck
pnpm dev
```

## Expected Result
- Desktop app launches.
- Renderer displays Headquarters shell.
- HQOS can emit and store initial events in memory.
- Database package contains the initial SQLite migration.

## Build Rule
Do not add trading execution features. Headquarters remains platform-independent and does not place broker trades.
